package main

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// Pustaka suara bel — dipakai halaman /admin/bel/suara (lewat BFF SIMAD).
//
//	GET    /api/suara         → {"files":[{"name","size","used_by"}]}
//	POST   /api/suara         → unggah multipart (field "file")
//	DELETE /api/suara/<nama>  → hapus dari SOUND_BASE + sound-cache
//
// Sebelum ini ketiga rute TIDAK ADA di worker, sehingga halaman suara selalu
// kosong ("Belum ada file suara") walau file asli ada di SOUND_BASE.

const maxSuaraBytes = 10 << 20 // 10 MB

var allowedSuaraExt = map[string]bool{
	".mp3": true,
	".wav": true,
	".m4a": true,
	".wma": true,
}

type suaraFile struct {
	Name   string `json:"name"`
	Size   int64  `json:"size"`
	UsedBy int    `json:"used_by"`
}

type suaraListResponse struct {
	OK    bool        `json:"ok"`
	Files []suaraFile `json:"files"`
	Error string      `json:"error,omitempty"`
}

type suaraActionResponse struct {
	OK    bool   `json:"ok"`
	Name  string `json:"name,omitempty"`
	Pesan string `json:"pesan,omitempty"`
	Error string `json:"error,omitempty"`
}

// namaSuaraAman: tolak path traversal & nama kosong, ambil basename saja.
func namaSuaraAman(raw string) (string, bool) {
	name := strings.TrimSpace(raw)
	if name == "" {
		return "", false
	}
	name = filepath.Base(strings.ReplaceAll(name, "\\", "/"))
	if name == "." || name == ".." || strings.HasPrefix(name, ".") {
		return "", false
	}
	if !allowedSuaraExt[strings.ToLower(filepath.Ext(name))] {
		return "", false
	}
	return name, true
}

func ekstensiSuaraValid(name string) bool {
	return allowedSuaraExt[strings.ToLower(filepath.Ext(name))]
}

// daftarSuara: isi SOUND_BASE + jumlah pemakaian di jam_bel (used_by).
func daftarSuara(soundBase string, usage func() map[string]int) suaraListResponse {
	entries, err := os.ReadDir(soundBase)
	if err != nil {
		errlg.Println("suara: baca folder gagal:", err)
		return suaraListResponse{OK: false, Files: []suaraFile{}, Error: "folder suara tidak bisa dibaca"}
	}
	used := map[string]int{}
	if usage != nil {
		used = usage()
	}
	files := []suaraFile{}
	for _, e := range entries {
		if e.IsDir() || !ekstensiSuaraValid(e.Name()) {
			continue
		}
		info, err := e.Info()
		if err != nil {
			continue
		}
		files = append(files, suaraFile{Name: e.Name(), Size: info.Size(), UsedBy: used[e.Name()]})
	}
	sort.Slice(files, func(i, j int) bool { return strings.ToLower(files[i].Name) < strings.ToLower(files[j].Name) })
	return suaraListResponse{OK: true, Files: files}
}

// hapusSuara: hapus dari SOUND_BASE dan cache lokal (dua-duanya, kalau ada).
func hapusSuara(soundBase, cacheDir, name string) suaraActionResponse {
	target := filepath.Join(soundBase, name)
	if _, err := os.Stat(target); err != nil {
		return suaraActionResponse{OK: false, Error: "file suara tidak ditemukan"}
	}
	if err := os.Remove(target); err != nil {
		errlg.Printf("suara: hapus %s gagal: %v", target, err)
		return suaraActionResponse{OK: false, Error: "gagal menghapus file"}
	}
	// cache ikut dibuang supaya tidak ada sisa yang diputar.
	_ = os.Remove(filepath.Join(cacheDir, name))
	info.Printf("suara: %s dihapus (SOUND_BASE + cache)", name)
	return suaraActionResponse{OK: true, Name: name, Pesan: "Suara \"" + name + "\" dihapus."}
}

// simpanSuara: tulis hasil unggah ke SOUND_BASE (tolak jika nama sudah ada).
func simpanSuara(r *http.Request, soundBase string) suaraActionResponse {
	if err := r.ParseMultipartForm(maxSuaraBytes); err != nil {
		return suaraActionResponse{OK: false, Error: "berkas tidak valid atau melebihi 10 MB"}
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		return suaraActionResponse{OK: false, Error: "field \"file\" tidak ditemukan"}
	}
	defer file.Close()

	name, ok := namaSuaraAman(header.Filename)
	if !ok {
		return suaraActionResponse{OK: false, Error: "format tidak didukung (mp3/wav/m4a/wma)"}
	}
	target := filepath.Join(soundBase, name)
	if _, err := os.Stat(target); err == nil {
		return suaraActionResponse{OK: false, Error: "file suara \"" + name + "\" sudah ada — hapus dulu"}
	}
	if err := os.MkdirAll(soundBase, 0755); err != nil {
		return suaraActionResponse{OK: false, Error: "folder suara tidak bisa dibuat"}
	}
	dst, err := os.Create(target)
	if err != nil {
		errlg.Printf("suara: buat %s gagal: %v", target, err)
		return suaraActionResponse{OK: false, Error: "gagal menyimpan berkas"}
	}
	n, err := io.Copy(dst, file)
	cerr := dst.Close()
	if err != nil || cerr != nil {
		_ = os.Remove(target)
		errlg.Printf("suara: tulis %s gagal: %v / %v", target, err, cerr)
		return suaraActionResponse{OK: false, Error: "gagal menyimpan berkas"}
	}
	info.Printf("suara: %s terunggah (%d bytes)", name, n)
	return suaraActionResponse{OK: true, Name: name, Pesan: "Suara \"" + name + "\" terupload."}
}

// registerSuaraRoutes: pasang rute /api/suara dan /api/suara/.
func registerSuaraRoutes(mux *http.ServeMux, soundBase, cacheDir string,
	checkAuth func(http.ResponseWriter, *http.Request) bool, usage func() map[string]int) {

	mux.HandleFunc("/api/suara", func(w http.ResponseWriter, r *http.Request) {
		if !checkAuth(w, r) {
			return
		}
		switch r.Method {
		case http.MethodGet:
			writeJSON(w, http.StatusOK, daftarSuara(soundBase, usage))
		case http.MethodPost:
			res := simpanSuara(r, soundBase)
			code := http.StatusOK
			if !res.OK {
				code = http.StatusBadRequest
			}
			writeJSON(w, code, res)
		default:
			writeJSON(w, http.StatusMethodNotAllowed, suaraActionResponse{OK: false, Error: "method harus GET/POST"})
		}
	})

	mux.HandleFunc("/api/suara/", func(w http.ResponseWriter, r *http.Request) {
		if !checkAuth(w, r) {
			return
		}
		if r.Method != http.MethodDelete {
			writeJSON(w, http.StatusMethodNotAllowed, suaraActionResponse{OK: false, Error: "method harus DELETE"})
			return
		}
		raw := strings.TrimPrefix(r.URL.Path, "/api/suara/")
		name, ok := namaSuaraAman(raw)
		if !ok {
			writeJSON(w, http.StatusBadRequest, suaraActionResponse{OK: false, Error: "nama suara tidak valid"})
			return
		}
		res := hapusSuara(soundBase, cacheDir, name)
		code := http.StatusOK
		if !res.OK {
			code = http.StatusNotFound
		}
		writeJSON(w, code, res)
	})
}
