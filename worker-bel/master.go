package main

import (
	"strings"
	"sync/atomic"
)

// Master switch bel: kalau NONAKTIF, scheduler meniadakan SEMUA bel
// (mode darurat: rapat mendadak, siswa pulang lebih cepat, dll).
// Sumber kebenaran di SQLite mtsn2kolut (tabel bel_settings, key
// 'bel_master' — ditulis oleh web app). Bel service hanya baca DB tiap
// tick + update memori instan lewat API /api/master (dipanggil web app).

var masterOn atomic.Bool

func init() {
	masterOn.Store(true) // default aman: bel aktif
}

func SetMasterEnabled(on bool) {
	masterOn.Store(on)
}

func MasterEnabled() bool {
	return masterOn.Load()
}

// loadMaster: baca 'bel_master' dari DB. Error → default AKTIF (fail-safe:
// jangan sampai bel mati total gara-gara baris setting hilang/DB error).
func (s *Scheduler) loadMaster() (bool, error) {
	if s.db == nil {
		return true, nil
	}
	var v string
	err := s.db.QueryRow(`SELECT value FROM bel_settings WHERE key = 'bel_master'`).Scan(&v)
	if err != nil {
		return true, err
	}
	return strings.TrimSpace(v) == "1", nil
}
