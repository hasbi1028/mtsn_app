package main

import (
	"encoding/json"
	"io"
	"net"
	"net/http"
	"path/filepath"
	"strings"
	"time"
)

// API bel service: POST /api/play {"path":"..."} — putar file via MCI.
// Dipanggil server-side oleh web app mtsn2kolut (token tidak pernah ke browser).
// Keamanan: header X-API-Key wajib (BEL_API_KEY). Kalau key kosong, hanya
// menerima dari 127.0.0.1/::1 (localhost) dan log warning.

type playRequest struct {
	Path   string `json:"path"`
	Repeat int    `json:"repeat,omitempty"`
}

type playResponse struct {
	OK    bool   `json:"ok"`
	Error string `json:"error,omitempty"`
}

type statusResponse struct {
	Playing bool   `json:"playing"`
	Path    string `json:"path,omitempty"`
	Master  bool   `json:"master"`
}

type masterRequest struct {
	Enabled bool `json:"enabled"`
}

func startAPIServer(port, apiKey, soundBase string) *http.Server {
	mux := http.NewServeMux()

	// auth helper
	checkAuth := func(w http.ResponseWriter, r *http.Request) bool {
		key := strings.TrimSpace(r.Header.Get("X-API-Key"))
		if apiKey != "" {
			if key == "" || key != apiKey {
				writeJSON(w, http.StatusUnauthorized, playResponse{OK: false, Error: "X-API-Key salah"})
				return false
			}
			return true
		}
		host, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil || (host != "127.0.0.1" && host != "::1") {
			writeJSON(w, http.StatusForbidden, playResponse{OK: false, Error: "hanya localhost (set BEL_API_KEY)"})
			return false
		}
		return true
	}

	mux.HandleFunc("/api/play", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, playResponse{OK: false, Error: "method harus POST"})
			return
		}

		// Baca body dulu sebelum auth — kalau server menutup koneksi tanpa
		// membaca body, client (browser/fetch) bisa dapat ConnectionReset.
		raw, _ := io.ReadAll(r.Body)
		r.Body.Close()

		if !checkAuth(w, r) {
			return
		}

		var req playRequest
		if err := json.Unmarshal(raw, &req); err != nil || strings.TrimSpace(req.Path) == "" {
			writeJSON(w, http.StatusBadRequest, playResponse{OK: false, Error: "body harus {\"path\":\"...\"}"})
			return
		}

		// resolve path: absolut → langsung; nama file polos → SOUND_BASE;
		// relatif dengan folder → absolut dari CWD bel.
		path := strings.TrimSpace(req.Path)
		if !filepath.IsAbs(path) {
			if !strings.ContainsAny(path, `/\`) {
				path = filepath.Join(soundBase, path)
			} else if abs, err := filepath.Abs(path); err == nil {
				path = abs
			}
		}

		repeat := req.Repeat
		if repeat < 1 {
			repeat = 1
		}
		if repeat > 10 {
			repeat = 10
		}

		info.Printf("API /api/play: %s (repeat=%d)", path, repeat)
		if err := startPlayback(path, repeat, false); err != nil {
			errlg.Printf("API play ditolak: %v", err)
			writeJSON(w, http.StatusConflict, playResponse{OK: false, Error: err.Error()})
			return
		}
		writeJSON(w, http.StatusOK, playResponse{OK: true})
	})

	mux.HandleFunc("/api/stop", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, playResponse{OK: false, Error: "method harus POST"})
			return
		}
		if !checkAuth(w, r) {
			return
		}
		stopPlayback()
		info.Println("API /api/stop: pemutaran dihentikan")
		writeJSON(w, http.StatusOK, playResponse{OK: true})
	})

	mux.HandleFunc("/api/master", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, playResponse{OK: false, Error: "method harus POST"})
			return
		}
		raw, _ := io.ReadAll(r.Body)
		r.Body.Close()
		if !checkAuth(w, r) {
			return
		}
		var req masterRequest
		if err := json.Unmarshal(raw, &req); err != nil {
			writeJSON(w, http.StatusBadRequest, playResponse{OK: false, Error: "body harus {\"enabled\":true|false}"})
			return
		}
		SetMasterEnabled(req.Enabled)
		if !req.Enabled {
			// mode darurat: hentikan bel yang sedang berbunyi SEKARANG
			stopPlayback()
		}
		info.Printf("API /api/master: enabled=%v (bel %s)", req.Enabled,
			map[bool]string{true: "AKTIF", false: "NONAKTIF (darurat)"}[req.Enabled])
		writeJSON(w, http.StatusOK, playResponse{OK: true})
	})

	mux.HandleFunc("/api/status", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			writeJSON(w, http.StatusMethodNotAllowed, playResponse{OK: false, Error: "method harus GET"})
			return
		}
		playing, path := statusPlayback()
		writeJSON(w, http.StatusOK, statusResponse{Playing: playing, Path: path, Master: MasterEnabled()})
	})

	srv := &http.Server{
		Addr:         "127.0.0.1:" + port,
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 5 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
	go func() {
		info.Printf("API server: http://127.0.0.1:%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errlg.Printf("API server error: %v", err)
		}
	}()
	return srv
}

func writeJSON(w http.ResponseWriter, code int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(v)
}
