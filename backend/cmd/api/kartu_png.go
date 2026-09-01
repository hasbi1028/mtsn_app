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
	"strconv"
	"strings"
	"time"

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
func kartuPath(id string) string { return filepath.Join(kartuDir(), id+".png") }

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
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("generate kartu: %s — %s", err.Error(), stderr.String())
	}
	return nil
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
		if gerr := renderKartuToFile(id, buildKartuHTMLData(sd)); gerr != nil {
			failed++
			errs = append(errs, id+": "+gerr.Error())
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
		ID       int    `json:"id"`
		Nama     string `json:"nama"`
		Kelas    string `json:"kelas"`
		Rombel   string `json:"rombel"`
		HasKartu bool   `json:"has_kartu"`
	}
	list := []item{}
	for rows.Next() {
		var id int
		var nama, kelas, rombel, foto sql.NullString
		if rows.Scan(&id, &nama, &kelas, &rombel, &foto) != nil {
			continue
		}
		_, kerr := os.Stat(kartuPath(strconv.Itoa(id)))
		list = append(list, item{
			ID: id, Nama: nama.String, Kelas: kelas.String,
			Rombel: rombel.String, HasKartu: kerr == nil,
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