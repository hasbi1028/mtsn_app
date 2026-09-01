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
	"strings"
	"time"
)

// GET /api/siswa/{id}/kartu.png — generate kartu PNG via Playwright screenshot
func (s *apiServer) handleSiswaKartuPNG(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	if idStr == "" {
		fail(w, 400, "id wajib")
		return
	}

	// Fetch siswa data
	var nama, nisn, jk, kelas, rombel, tempat, tgl sql.NullString
	var fotoRel sql.NullString
	err := s.db.QueryRow(`SELECT nama, nisn, jk, kelas, rombel, tempat_lahir, tgl_lahir, foto_path
		FROM siswa WHERE id = ?`, idStr).
		Scan(&nama, &nisn, &jk, &kelas, &rombel, &tempat, &tgl, &fotoRel)
	if errors.Is(err, sql.ErrNoRows) {
		fail(w, 404, "siswa tidak ditemukan")
		return
	} else if err != nil {
		fail(w, 500, err.Error())
		return
	}

	// Read logo as data URL
	logoPath := filepath.Join("..", "static", "uploads", "logo-kemenag.png")
	logoDataURL := readImageDataURL(logoPath)

	// Read foto siswa as data URL (if exists)
	fotoDataURL := ""
	if fotoRel.Valid && fotoRel.String != "" {
		fotoFull := filepath.Join("..", "static", fotoRel.String)
		fotoDataURL = readImageDataURL(fotoFull)
	}

	// Build data map
 initials := strings.Fields(strings.ToUpper(nama.String))
 initialsStr := "?"
 if len(initials) >= 2 {
   r0 := []rune(initials[0])
   r1 := []rune(initials[1])
   initialsStr = string([]rune{r0[0], r1[0]})
 } else if len(initials) == 1 && len(initials[0]) > 0 {
   r0 := []rune(initials[0])
   initialsStr = string([]rune{r0[0]})
 }

	genderLabel := "—"
	if jk.String == "L" {
		genderLabel = "Laki-laki"
	} else if jk.String == "P" {
		genderLabel = "Perempuan"
	}
	kelasRombel := strings.TrimSpace(kelas.String + " " + rombel.String)
	tglFormatted := formatTglID(tgl.String)
	tempatTitle := strings.Title(strings.ToLower(tempat.String))

	// Generate standalone HTML with inline CSS + data
	html := generateKartuHTML(kartuHTMLData{
		Nama:        strings.ToUpper(nama.String),
		NISN:        nisn.String,
		Gender:      genderLabel,
		Kelas:       kelasRombel,
		TempatLahir: tempatTitle,
		TglLahir:    tglFormatted,
		LogoDataURL: logoDataURL,
		FotoDataURL: fotoDataURL,
		Initials:    initialsStr,
	})

	// Write HTML to temp file
	tmpHTML := filepath.Join(os.TempDir(), fmt.Sprintf("kartu-%s-%d.html", idStr, time.Now().UnixNano()))
	os.WriteFile(tmpHTML, []byte(html), 0644)
	defer os.Remove(tmpHTML)

	// Write PNG output path
	tmpPNG := filepath.Join(os.TempDir(), fmt.Sprintf("kartu-%s-%d.png", idStr, time.Now().UnixNano()))
	defer os.Remove(tmpPNG)

	// Run Playwright screenshot
	scriptsDir, _ := filepath.Abs(filepath.Join("..", "scripts"))
	scriptPath := filepath.Join(scriptsDir, "kartu-screenshot.mjs")
	cmd := exec.Command("node", scriptPath, tmpHTML, tmpPNG)
	cmd.Dir = filepath.Join("..") // project root
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		fail(w, 500, fmt.Sprintf("gagal generate kartu: %s — %s", err.Error(), stderr.String()))
		return
	}

	// Read PNG and write to response
	pngData, err := os.ReadFile(tmpPNG)
	if err != nil {
		fail(w, 500, "gagal baca PNG: "+err.Error())
		return
	}

	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="kartu-siswa-%s.png"`, idStr))
	w.Header().Set("Cache-Control", "no-cache")
	w.Write(pngData)
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
  header {
    display: flex;
    align-items: center;
    gap: 3mm;
    z-index: 1;
  }
  header img {
    width: 11mm;
    height: 11mm;
    object-fit: contain;
  }
  header div { flex: 1; }
  .kicker {
    font-size: 5.3pt;
    letter-spacing: 0.55pt;
    margin: 0;
    font-weight: 700;
  }
  .school {
    font-size: 10pt;
    letter-spacing: 0.2pt;
    font-weight: 900;
    margin: 1pt 0;
  }
  .meta {
    font-size: 5pt;
    color: #6b786f;
    letter-spacing: 0.35pt;
    margin: 0;
  }
  .rule {
    height: 1.2pt;
    margin: 2.5mm 0 2.8mm;
    background: linear-gradient(90deg, #b38732, #e5cc8b, transparent);
  }
  section {
    display: flex;
    gap: 3mm;
    flex: 1;
    z-index: 1;
  }
  .photo {
    width: 22mm;
    height: 27mm;
    flex-shrink: 0;
    border-radius: 1.5mm;
    border: 1pt solid #c9ae62;
    box-sizing: border-box;
    overflow: hidden;
    display: grid;
    place-items: center;
    background: linear-gradient(145deg, #dbeadf, #f3f7ee);
  }
  .photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .photo .initials {
    font-size: 16pt;
    font-weight: 900;
    color: #276044;
  }
  .data {
    flex: 1;
    min-width: 0;
  }
  .name {
    font-size: 11pt;
    line-height: 1.05;
    font-weight: 900;
    text-transform: uppercase;
    margin: 0 0 2.5mm;
    max-width: 48mm;
    overflow: hidden;
  }
  .data > div {
    display: flex;
    gap: 2mm;
    align-items: baseline;
    margin: 1.1mm 0;
    font-size: 6.2pt;
  }
  .data span {
    width: 20mm;
    flex-shrink: 0;
    color: #77857b;
    font-size: 5.2pt;
    letter-spacing: 0.35pt;
    font-weight: 700;
  }
  .data strong {
    font-size: 6.8pt;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .data .birth strong {
    font-size: 5.7pt;
  }
  footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #e1d6b8;
    padding-top: 1.7mm;
    color: #758078;
    font-size: 4.8pt;
    letter-spacing: 0.2pt;
    z-index: 1;
  }
  footer strong {
    color: #b38732;
    font-size: 5pt;
  }
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
      <p class="meta">NSM 228220540002 · KARTU PELAJAR</p>
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
	encoded := base64.StdEncoding.EncodeToString(data)
	return "data:" + mime + ";base64," + encoded
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
