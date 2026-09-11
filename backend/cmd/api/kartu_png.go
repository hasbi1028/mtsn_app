package main

import (
	"bytes"
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"

	qrcode "github.com/skip2/go-qrcode"
	_ "modernc.org/sqlite"
)

// ---------- Kartu Siswa PNG — private cache ----------
//
// Kartu digenerate via Playwright SEKALI per siswa (per versi foto), lalu
// disimpan di direktori PRIVAT `data/kartu/{id}.png` (bukan static/web).
// Download berikutnya serve dari file langsung (instan, tanpa Playwright).
// Cache divalidasi dengan membandingkan mtime file foto: kalau foto berubah,
// kartu dianggap stale dan di-generate ulang.

func kartuDir() string {
	// Private dir ABSOLUT (tidak bergantung cwd proses): <projec_root>/data/kartu
	// api.exe berada di <root>/backend/api.exe → root = dir(exe)/..
	if exe, err := os.Executable(); err == nil {
		return filepath.Join(filepath.Join(filepath.Dir(exe), ".."), "data", "kartu")
	}
	return filepath.Join("data", "kartu")
}
func kartuPath(id string) string      { return filepath.Join(kartuDir(), id+".png") }
func kartuBackPath(id string) string  { return filepath.Join(kartuDir(), id+"-back.png") }

func fileMtime(p string) time.Time {
	st, err := os.Stat(p)
	if err != nil {
		return time.Time{}
	}
	return st.ModTime()
}

// fotoFullPath resolves a DB foto_path (e.g. "uploads/foto_siswa/29.png")
// to an absolute-ish filesystem path under static/, if the file exists.
func fotoFullPath(fotoRel string) string {
	if fotoRel == "" {
		return ""
	}
	p := filepath.Join("..", "static", fotoRel)
	if _, err := os.Stat(p); err != nil {
		return ""
	}
	return p
}

// kartuFresh returns true if a cached kartu exists AND is not older than the
// student's photo (i.e. data hasn't changed since last render).
func kartuFresh(id, fotoPath string) bool {
	ks, err := os.Stat(kartuPath(id))
	if err != nil {
		return false
	}
	if fotoPath != "" {
		fm := fileMtime(fotoPath)
		if !fm.IsZero() && ks.ModTime().Before(fm) {
			return false
		}
	}
	return true
}

func kartuBackFresh(id, fotoPath string) bool {
	ks, err := os.Stat(kartuBackPath(id))
	if err != nil {
		return false
	}
	if fotoPath != "" {
		fm := fileMtime(fotoPath)
		if !fm.IsZero() && ks.ModTime().Before(fm) {
			return false
		}
	}
	return true
}

type siswaKartu struct {
	ID      string
	Nama    string
	NISN    string
	JK      string
	Kelas   string
	Rombel  string
	Tempat  string
	TglLahir string
	FotoRel string
}

func (s *apiServer) getSiswaKartu(id string) (*siswaKartu, error) {
	var idInt int
	var nama, nisn, jk, kelas, rombel, tempat, tgl, foto sql.NullString
	err := s.db.QueryRow(`SELECT id, nama, nisn, jk, kelas, rombel, tempat_lahir, tgl_lahir, foto_path
		FROM siswa WHERE id = ?`, id).
		Scan(&idInt, &nama, &nisn, &jk, &kelas, &rombel, &tempat, &tgl, &foto)
	if err != nil {
		return nil, err
	}
	return &siswaKartu{
		ID:       strconv.Itoa(idInt),
		Nama:     nama.String,
		NISN:     nisn.String,
		JK:       jk.String,
		Kelas:    kelas.String,
		Rombel:   rombel.String,
		Tempat:   tempat.String,
		TglLahir: tgl.String,
		FotoRel:  foto.String,
	}, nil
}

func buildKartuHTMLData(d *siswaKartu) kartuHTMLData {
	logoPath := filepath.Join("..", "static", "uploads", "logo-kemenag.png")
	foto := ""
	if fp := fotoFullPath(d.FotoRel); fp != "" {
		foto = readImageDataURL(fp)
	}

	// initials
	initialsStr := "?"
	if parts := strings.Fields(strings.ToUpper(d.Nama)); len(parts) >= 2 {
		r0 := []rune(parts[0])
		r1 := []rune(parts[1])
		initialsStr = string([]rune{r0[0], r1[0]})
	} else if len(parts) == 1 && len(parts[0]) > 0 {
		r0 := []rune(parts[0])
		initialsStr = string([]rune{r0[0]})
	}

	genderLabel := "—"
	if d.JK == "L" {
		genderLabel = "Laki-laki"
	} else if d.JK == "P" {
		genderLabel = "Perempuan"
	}
	kelasRombel := strings.TrimSpace(d.Kelas + " " + d.Rombel)
	tempatTitle := strings.Title(strings.ToLower(d.Tempat))

	return kartuHTMLData{
		Nama:        strings.ToUpper(d.Nama),
		NISN:        d.NISN,
		Gender:      genderLabel,
		Kelas:       kelasRombel,
		TempatLahir: tempatTitle,
		TglLahir:    formatTglID(d.TglLahir),
		LogoDataURL: readImageDataURL(logoPath),
		FotoDataURL: foto,
		Initials:    initialsStr,
	}
}

// renderKartuToFile generates the kartu via Playwright and saves directly to
// the private cache file data/kartu/{id}.png.
func renderKartuToFile(id string, d kartuHTMLData) error {
	html := generateKartuHTML(d)
	tmpHTML := filepath.Join(os.TempDir(), fmt.Sprintf("kartu-%s-%d.html", id, time.Now().UnixNano()))
	if err := os.WriteFile(tmpHTML, []byte(html), 0644); err != nil {
		return err
	}
	defer os.Remove(tmpHTML)

	out := kartuPath(id)
	if err := os.MkdirAll(filepath.Dir(out), 0755); err != nil {
		return err
	}

	scriptsDir, _ := filepath.Abs(filepath.Join("..", "scripts"))
	scriptPath := filepath.Join(scriptsDir, "kartu-screenshot.mjs")
	cmd := exec.Command("node", scriptPath, tmpHTML, out)
	cmd.Dir = filepath.Join("..")
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := runWithTimeout(cmd, 60*time.Second); err != nil {
		return fmt.Errorf("generate kartu: %s — %s", err.Error(), stderr.String())
	}
	return nil
}

func renderKartuBackToFile(id string, d kartuHTMLData) error {
	html := generateKartuBackHTML(d)
	tmpHTML := filepath.Join(os.TempDir(), fmt.Sprintf("kartu-back-%s-%d.html", id, time.Now().UnixNano()))
	if err := os.WriteFile(tmpHTML, []byte(html), 0644); err != nil {
		return err
	}
	defer os.Remove(tmpHTML)

	out := kartuBackPath(id)
	if err := os.MkdirAll(filepath.Dir(out), 0755); err != nil {
		return err
	}

	scriptsDir, _ := filepath.Abs(filepath.Join("..", "scripts"))
	scriptPath := filepath.Join(scriptsDir, "kartu-screenshot.mjs")
	cmd := exec.Command("node", scriptPath, tmpHTML, out)
	cmd.Dir = filepath.Join("..")
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := runWithTimeout(cmd, 60*time.Second); err != nil {
		return fmt.Errorf("generate kartu back: %s — %s", err.Error(), stderr.String())
	}
	return nil
}

func runWithTimeout(cmd *exec.Cmd, timeout time.Duration) error {
	if runtime.GOOS == "windows" {
		cmd.SysProcAttr = &syscall.SysProcAttr{CreationFlags: 0x08000000} // CREATE_NO_WINDOW
	}
	if err := cmd.Start(); err != nil {
		return err
	}
	done := make(chan error, 1)
	go func() { done <- cmd.Wait() }()

	select {
	case err := <-done:
		return err
	case <-time.After(timeout):
		cmd.Process.Kill()
		return fmt.Errorf("timeout after %v", timeout)
	}
}

func serveKartuFile(w http.ResponseWriter, id string) {
	pngData, err := os.ReadFile(kartuPath(id))
	if err != nil {
		fail(w, 500, "gagal baca kartu: "+err.Error())
		return
	}
	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="kartu-siswa-%s.png"`, id))
	w.Header().Set("Cache-Control", "no-cache")
	w.Write(pngData)
}

func serveKartuBackFile(w http.ResponseWriter, id string) {
	pngData, err := os.ReadFile(kartuBackPath(id))
	if err != nil {
		fail(w, 500, "gagal baca kartu belakang: "+err.Error())
		return
	}
	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="kartu-siswa-%s-belakang.png"`, id))
	w.Header().Set("Cache-Control", "no-cache")
	w.Write(pngData)
}

// GET /api/siswa/{id}/kartu-back.png — serve cached kartu back, generate once if needed
func (s *apiServer) handleSiswaKartuBackPNG(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		fail(w, 400, "id wajib")
		return
	}
	sd, err := s.getSiswaKartu(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			fail(w, 404, "siswa tidak ditemukan")
		} else {
			fail(w, 500, err.Error())
		}
		return
	}
	fotoPath := fotoFullPath(sd.FotoRel)
	if !kartuBackFresh(id, fotoPath) {
		if err := renderKartuBackToFile(id, buildKartuHTMLData(sd)); err != nil {
			fail(w, 500, err.Error())
			return
		}
	}
	serveKartuBackFile(w, id)
}

// POST /api/siswa/{id}/kartu/regenerate — force regenerate front + back for one student
func (s *apiServer) handleKartuRegenerate(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		fail(w, 400, "id wajib")
		return
	}
	sd, err := s.getSiswaKartu(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			fail(w, 404, "siswa tidak ditemukan")
		} else {
			fail(w, 500, err.Error())
		}
		return
	}
	d := buildKartuHTMLData(sd)
	if err := renderKartuToFile(id, d); err != nil {
		fail(w, 500, "gagal generate depan: "+err.Error())
		return
	}
	if err := renderKartuBackToFile(id, d); err != nil {
		fail(w, 500, "gagal generate belakang: "+err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true, "message": "kartu berhasil digenerate ulang"})
}

// GET /api/siswa/{id}/kartu.png — serve cached kartu, generate once if needed
func (s *apiServer) handleSiswaKartuPNG(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		fail(w, 400, "id wajib")
		return
	}
	sd, err := s.getSiswaKartu(id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			fail(w, 404, "siswa tidak ditemukan")
		} else {
			fail(w, 500, err.Error())
		}
		return
	}
	fotoPath := fotoFullPath(sd.FotoRel)
	if !kartuFresh(id, fotoPath) {
		if err := renderKartuToFile(id, buildKartuHTMLData(sd)); err != nil {
			fail(w, 500, err.Error())
			return
		}
	}
	serveKartuFile(w, id)
}

// POST /api/siswa/kartu/generate-all — generate kartu utk semua siswa ber-foto (sekali)
func (s *apiServer) handleKartuGenerateAll(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(`SELECT id FROM siswa
		WHERE foto_path IS NOT NULL AND foto_path != ''
		  AND (status_emis IS NULL OR status_emis LIKE 'Aktif%')`)
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id int
		if rows.Scan(&id) == nil {
			ids = append(ids, strconv.Itoa(id))
		}
	}

	generated, failed := 0, 0
	var errs []string
	for _, id := range ids {
		sd, gerr := s.getSiswaKartu(id)
		if gerr != nil {
			failed++
			continue
		}
		d := buildKartuHTMLData(sd)
		if gerr := renderKartuToFile(id, d); gerr != nil {
			failed++
			errs = append(errs, id+": front: "+gerr.Error())
			continue
		}
		if gerr := renderKartuBackToFile(id, d); gerr != nil {
			failed++
			errs = append(errs, id+": back: "+gerr.Error())
			continue
		}
		generated++
	}
	writeJSON(w, 200, map[string]any{
		"total":     len(ids),
		"generated": generated,
		"failed":    failed,
		"errors":    errs,
	})
}

// GET /api/siswa/kartu/list — daftar siswa ber-foto + status kartu cache
func (s *apiServer) handleKartuList(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(`SELECT id, nama, kelas, rombel, foto_path FROM siswa
		WHERE foto_path IS NOT NULL AND foto_path != ''
		  AND (status_emis IS NULL OR status_emis LIKE 'Aktif%')
		ORDER BY CAST(kelas AS INTEGER), rombel, nama`)
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	defer rows.Close()

	type item struct {
		ID         int    `json:"id"`
		Nama       string `json:"nama"`
		Kelas      string `json:"kelas"`
		Rombel     string `json:"rombel"`
		HasKartu   bool   `json:"has_kartu"`
		HasKartuBack bool `json:"has_kartu_back"`
	}
	list := []item{}
	for rows.Next() {
		var id int
		var nama, kelas, rombel, foto sql.NullString
		if rows.Scan(&id, &nama, &kelas, &rombel, &foto) != nil {
			continue
		}
		_, kerr := os.Stat(kartuPath(strconv.Itoa(id)))
		_, kerrBack := os.Stat(kartuBackPath(strconv.Itoa(id)))
		list = append(list, item{
			ID: id, Nama: nama.String, Kelas: kelas.String,
			Rombel: rombel.String, HasKartu: kerr == nil, HasKartuBack: kerrBack == nil,
		})
	}
	writeJSON(w, 200, map[string]any{"rows": list})
}

type kartuHTMLData struct {
	Nama, NISN, Gender, Kelas, TempatLahir, TglLahir string
	LogoDataURL, FotoDataURL                        string
	Initials                                         string
}

func generateKartuHTML(d kartuHTMLData) string {
	fotoSection := ""
	if d.FotoDataURL != "" {
		fotoSection = `<img src="` + d.FotoDataURL + `" alt="Foto" />`
	} else {
		fotoSection = `<span class="initials">` + d.Initials + `</span>`
	}

	return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  .card {
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    width: 85mm;
    height: 55mm;
    padding: 4mm;
    display: flex;
    flex-direction: column;
    background: #fff;
    border-radius: 3mm;
    border: 1px solid #d1b56a;
    color: #173d2b;
  }
  .orbit {
    position: absolute;
    width: 34mm;
    height: 34mm;
    right: -15mm;
    top: -17mm;
    border-radius: 50%;
    background: #e8f1e9;
    border: 5mm solid #f5ead0;
  }
  header { display: flex; align-items: center; gap: 3mm; z-index: 1; }
  header img { width: 11mm; height: 11mm; object-fit: contain; }
  header div { flex: 1; }
  .kicker {
    font-size: 5.3pt; letter-spacing: 0.55pt; margin: 0; font-weight: 700;
  }
  .school {
    font-size: 10pt; letter-spacing: 0.2pt; font-weight: 900; margin: 1pt 0;
  }
  .meta {
    font-size: 5pt; color: #6b786f; letter-spacing: 0.35pt; margin: 0;
  }
  .rule {
    height: 1.2pt; margin: 2.5mm 0 2.8mm;
    background: linear-gradient(90deg, #b38732, #e5cc8b, transparent);
  }
  section { display: flex; gap: 3mm; flex: 1; z-index: 1; }
  .photo {
    width: 22mm; height: 27mm; flex-shrink: 0; border-radius: 1.5mm;
    border: 1pt solid #c9ae62; box-sizing: border-box; overflow: hidden;
    display: grid; place-items: center;
    background: linear-gradient(145deg, #dbeadf, #f3f7ee);
  }
  .photo img { width: 100%; height: 100%; object-fit: cover; }
  .photo .initials { font-size: 16pt; font-weight: 900; color: #276044; }
  .data { flex: 1; min-width: 0; }
  .name {
    font-size: 11pt; line-height: 1.05; font-weight: 900; text-transform: uppercase;
    margin: 0 0 2.5mm; max-width: 48mm; overflow: hidden;
  }
  .data > div { display: flex; gap: 2mm; align-items: baseline; margin: 1.1mm 0; font-size: 6.2pt; }
  .data span {
    width: 20mm; flex-shrink: 0; color: #77857b; font-size: 5.2pt;
    letter-spacing: 0.35pt; font-weight: 700;
  }
  .data strong { font-size: 6.8pt; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .data .birth strong { font-size: 5.7pt; }
  footer {
    display: flex; justify-content: space-between; align-items: center;
    border-top: 1px solid #e1d6b8; padding-top: 1.7mm;
    color: #758078; font-size: 4.8pt; letter-spacing: 0.2pt; z-index: 1;
  }
  footer strong { color: #b38732; font-size: 5pt; }
</style>
</head>
<body>
<div class="card">
  <div class="orbit"></div>
  <header>
    <img src="` + d.LogoDataURL + `" alt="Logo Kementerian Agama" />
    <div>
      <p class="kicker">KEMENTERIAN AGAMA REPUBLIK INDONESIA</p>
      <p class="school">MTsN 2 KOLAKA UTARA</p>
      <p class="meta">NSM 121174080002 · NPSN 40406031</p>
    </div>
  </header>
  <div class="rule"></div>
  <section>
    <div class="photo">` + fotoSection + `</div>
    <div class="data">
      <p class="name">` + d.Nama + `</p>
      <div><span>NISN</span><strong>` + d.NISN + `</strong></div>
      <div><span>KELAS</span><strong>` + d.Kelas + `</strong></div>
      <div><span>JENIS KELAMIN</span><strong>` + d.Gender + `</strong></div>
      <div class="birth"><span>LAHIR</span><strong>` + d.TempatLahir + `, ` + d.TglLahir + `</strong></div>
    </div>
  </section>
  <footer>
    <span>BERLAKU SELAMA TERDAFTAR</span>
    <strong>TA 2026 / 2027</strong>
  </footer>
</div>
	</body>
	</html>`
}

func generateQRCodeDataURL(content string, size int) string {
	png, err := qrcode.Encode(content, qrcode.Medium, size)
	if err != nil {
		return ""
	}
	return "data:image/png;base64," + base64.StdEncoding.EncodeToString(png)
}

func generateKartuBackHTML(d kartuHTMLData) string {
	qrDataURL := generateQRCodeDataURL(d.NISN, 200)
	qrImg := ""
	if qrDataURL != "" {
		qrImg = `<img src="` + qrDataURL + `" alt="QR" />`
	} else {
		qrImg = `<span class="qr-fallback">QR</span>`
	}

	return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background: #fff;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  .card {
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    width: 85mm;
    height: 55mm;
    padding: 4mm;
    display: flex;
    flex-direction: column;
    background: #fff;
    border-radius: 3mm;
    border: 1px solid #d1b56a;
    color: #173d2b;
  }
  .watermark {
    position: absolute;
    width: 50mm;
    height: 50mm;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.06;
    z-index: 0;
  }
  .watermark img { width: 100%; height: 100%; object-fit: contain; }
  .stripe {
    height: 1.5mm;
    background: linear-gradient(90deg, #b38732, #e5cc8b, #b38732);
    margin: 0 0 3mm;
    border-radius: 0.5mm;
    z-index: 1;
  }
  .stripe-bottom {
    height: 1.5mm;
    background: linear-gradient(90deg, #b38732, #e5cc8b, #b38732);
    margin: auto 0 0;
    border-radius: 0.5mm;
    z-index: 1;
  }
  .content {
    flex: 1;
    display: flex;
    gap: 3mm;
    z-index: 1;
  }
  .info { flex: 1; min-width: 0; }
  .info p {
    font-size: 5.5pt;
    margin: 1.2mm 0;
    line-height: 1.35;
    color: #3a5040;
  }
  .info .label {
    font-size: 4.8pt;
    color: #77857b;
    font-weight: 700;
    letter-spacing: 0.3pt;
    text-transform: uppercase;
  }
  .info .value { font-weight: 600; }
  .qr-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5mm;
    flex-shrink: 0;
  }
  .qr-section img {
    width: 16mm;
    height: 16mm;
    object-fit: contain;
  }
  .qr-fallback {
    width: 16mm;
    height: 16mm;
    display: grid;
    place-items: center;
    border: 1pt dashed #c9ae62;
    font-size: 5pt;
    color: #77857b;
  }
  .qr-label {
    font-size: 4.2pt;
    color: #77857b;
    letter-spacing: 0.2pt;
    text-align: center;
  }
  .notes {
    z-index: 1;
    border-top: 0.8pt solid #e1d6b8;
    padding-top: 2mm;
    margin-top: 2mm;
  }
  .notes p {
    font-size: 4.3pt;
    color: #758078;
    line-height: 1.4;
    margin: 0.5mm 0;
  }
  .notes strong { color: #3a5040; }
  .student-id {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    z-index: 1;
    margin-bottom: 2mm;
  }
  .student-name {
    font-size: 7pt;
    font-weight: 900;
    text-transform: uppercase;
    color: #173d2b;
    letter-spacing: 0.3pt;
  }
  .student-nisn {
    font-size: 5pt;
    color: #77857b;
    font-weight: 700;
    letter-spacing: 0.2pt;
  }
</style>
</head>
<body>
<div class="card">
  <div class="watermark"><img src="` + d.LogoDataURL + `" alt="" /></div>
  <div class="stripe"></div>
  <div class="student-id">
    <span class="student-name">` + d.Nama + `</span>
    <span class="student-nisn">NISN: ` + d.NISN + `</span>
  </div>
  <div class="content">
    <div class="info">
      <p><span class="label">Alamat</span><br/><span class="value">Jl. Lalume No. 42 Kelurahan Olo-Oloho<br/>Kec. Pakue, Kab. Kolaka Utara<br/>Sulawesi Tenggara 93954</span></p>
      <p><span class="label">Website</span> <span class="value">mtsn2kolut.sch.id</span></p>
      <p><span class="label">Email</span> <span class="value">mtsn.pakue@gmail.com</span></p>
    </div>
    <div class="qr-section">
      ` + qrImg + `
      <span class="qr-label">Scan untuk<br/>verifikasi data</span>
    </div>
  </div>
  <div class="notes">
    <p><strong>Ketentuan:</strong> Kartu ini berlaku selama terdaftar sebagai siswa MTsN 2 Kolaka Utara. Harap dikembalikan jika sudah tidak menempuh pendidikan. Kartu tidak dapat dialihkan ke orang lain.</p>
  </div>
  <div class="stripe-bottom"></div>
</div>
</body>
</html>`
}

func readImageDataURL(path string) string {
	data, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	ext := strings.ToLower(filepath.Ext(path))
	mime := "image/png"
	switch ext {
	case ".jpg", ".jpeg":
		mime = "image/jpeg"
	case ".gif":
		mime = "image/gif"
	}
	return "data:" + mime + ";base64," + base64.StdEncoding.EncodeToString(data)
}

func formatTglID(tgl string) string {
	parts := strings.Split(tgl, "-")
	if len(parts) != 3 {
		return tgl
	}
	bulan := []string{
		"Januari", "Februari", "Maret", "April", "Mei", "Juni",
		"Juli", "Agustus", "September", "Oktober", "November", "Desember",
	}
	var y, m, d int
	fmt.Sscanf(parts[0], "%d", &y)
	fmt.Sscanf(parts[1], "%d", &m)
	fmt.Sscanf(parts[2], "%d", &d)
	if m < 1 || m > 12 {
		return tgl
	}
	return fmt.Sprintf("%d %s %d", d, bulan[m-1], y)
}