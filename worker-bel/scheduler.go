package main

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	_ "modernc.org/sqlite"
)

// Schedule satu baris jam_bel dari SQLite SIMAD (local.db).
type Schedule struct {
	ID        string
	Hari      string // senin..minggu
	Jam       string // HH:MM
	Jenis     string
	Label     string
	SoundPath string
	Repeat    int
}

var weekdayToHari = map[time.Weekday]string{
	time.Monday:    "senin",
	time.Tuesday:   "selasa",
	time.Wednesday: "rabu",
	time.Thursday:  "kamis",
	time.Friday:    "jumat",
	time.Saturday:  "sabtu",
	time.Sunday:    "minggu",
}

// Scheduler polling SQLite tiap PollSeconds, trigger bel saat jam cocok.
// Resilien: kalau DB gagal dibaca, tetap pakai jadwal + sound cache terakhir.
type Scheduler struct {
	cfg      Config
	db       *sql.DB
	mu       sync.Mutex
	fired    map[string]string // id → "YYYY-MM-DD HH:MM" (cegah dobel dalam 1 menit)
	schedule []Schedule        // cache jadwal terakhir yang berhasil dibaca
	soundDir string            // cache sound lokal (sound-cache/)
	stop     chan struct{}

	masterWarned bool
}

func NewScheduler(cfg Config) *Scheduler {
	return &Scheduler{
		cfg:      cfg,
		fired:    map[string]string{},
		soundDir: "sound-cache",
		stop:     make(chan struct{}),
	}
}

func (s *Scheduler) Run() {
	if err := s.openDB(); err != nil {
		errlg.Printf("DB awal gagal: %v (dicoba ulang tiap tick)", err)
	}
	s.preload()

	ticker := time.NewTicker(time.Duration(s.cfg.PollSeconds) * time.Second)
	defer ticker.Stop()

	lastHeartbeat := time.Now()
	s.tick()

	for {
		select {
		case <-ticker.C:
			s.tick()
			if time.Since(lastHeartbeat) >= 5*time.Minute {
				s.heartbeat()
				lastHeartbeat = time.Now()
			}
		case <-s.stop:
			info.Println("scheduler berhenti")
			return
		}
	}
}

// openDB buka SQLite SIMAD; coba read-only dulu, fallback normal.
func (s *Scheduler) openDB() error {
	if s.db != nil {
		return nil
	}
	connStr := "file:" + s.cfg.DBPath + "?mode=ro&_pragma=busy_timeout(5000)"
	db, err := sql.Open("sqlite", connStr)
	if err == nil {
		db.SetMaxOpenConns(1)
		if err = db.Ping(); err == nil {
			s.db = db
			info.Println("DB terbuka (read-only):", s.cfg.DBPath)
			return nil
		}
		db.Close()
	}
	connStr = "file:" + s.cfg.DBPath + "?_pragma=busy_timeout(5000)"
	db2, err := sql.Open("sqlite", connStr)
	if err != nil {
		return err
	}
	db2.SetMaxOpenConns(1)
	if err := db2.Ping(); err != nil {
		db2.Close()
		return err
	}
	s.db = db2
	info.Println("DB terbuka (normal):", s.cfg.DBPath)
	return nil
}

func (s *Scheduler) loadSchedule() ([]Schedule, error) {
	if s.db == nil {
		return nil, fmt.Errorf("DB belum terbuka")
	}
	rows, err := s.db.Query(`SELECT id, hari, jam, jenis, label, sound_path, repeat
		FROM jam_bel WHERE aktif = 1`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Schedule
	for rows.Next() {
		var sc Schedule
		if err := rows.Scan(&sc.ID, &sc.Hari, &sc.Jam, &sc.Jenis, &sc.Label, &sc.SoundPath, &sc.Repeat); err != nil {
			return nil, err
		}
		out = append(out, sc)
	}
	return out, rows.Err()
}

// effectiveRepeat: kolom repeat di DB prioritas. Aturan: nama file
// diawali "indonesia"/"pancasila" diputar 1x (berlaku saat repeat default 2).
func effectiveRepeat(sc Schedule) int {
	r := sc.Repeat
	if r <= 0 {
		r = 2
	}
	base := strings.ToLower(filepath.Base(sc.SoundPath))
	if r == 2 && (strings.HasPrefix(base, "indonesia") || strings.HasPrefix(base, "pancasila")) {
		return 1
	}
	return r
}

func (s *Scheduler) tick() {
	if s.db == nil {
		if err := s.openDB(); err != nil {
			errlg.Printf("DB belum bisa dibuka: %v (pakai cache %d jadwal)", err, len(s.schedule))
		}
	}

	sched, err := s.loadSchedule()
	if err != nil {
		errlg.Printf("load schedule gagal: %v (pakai cache %d jadwal)", err, len(s.schedule))
	} else {
		s.mu.Lock()
		s.schedule = sched
		s.mu.Unlock()
	}

	// Master switch dari local.db (bel_settings)
	if on, err := s.loadMaster(); err == nil {
		SetMasterEnabled(on)
	}
	if !MasterEnabled() {
		if !s.masterWarned {
			info.Println("MASTER NONAKTIF — semua bel ditiadakan (mode darurat)")
			s.masterWarned = true
		}
		return
	}
	s.masterWarned = false

	now := time.Now()
	hari := weekdayToHari[now.Weekday()]
	jam := now.Format("15:04")
	nowKey := now.Format("2006-01-02 15:04")

	for _, sc := range sched {
		if sc.Hari != hari || sc.Jam != jam {
			continue
		}
		s.mu.Lock()
		if s.fired[sc.ID] == nowKey {
			s.mu.Unlock()
			continue
		}
		s.fired[sc.ID] = nowKey
		s.mu.Unlock()

		path := s.resolveSound(sc.SoundPath)
		if path == "" {
			errlg.Printf("suara kosong untuk jadwal %s (%s %s)", sc.ID, sc.Jam, sc.Label)
			continue
		}

		repeat := effectiveRepeat(sc)
		info.Printf("BEL TRIGGER: %s %s (%s) suara=%s repeat=%d", sc.Jam, sc.Jenis, sc.Label, path, repeat)
		if err := startPlayback(path, repeat, true); err != nil {
			errlg.Printf("trigger gagal: %v", err)
		}
	}
}

// resolveSound: prioritas file asli di SOUND_BASE, fallback sound-cache lokal.
func (s *Scheduler) resolveSound(name string) string {
	if name == "" {
		return ""
	}
	direct := filepath.Join(s.cfg.SoundBase, name)
	if _, err := os.Stat(direct); err == nil {
		return direct
	}
	return filepath.Join(s.soundDir, filepath.Base(name))
}

// preload: copy semua sound dari jadwal ke sound-cache/ saat start.
func (s *Scheduler) preload() {
	sched, err := s.loadSchedule()
	if err != nil {
		errlg.Println("preload: load schedule gagal:", err)
		return
	}
	if err := os.MkdirAll(s.soundDir, 0755); err != nil {
		errlg.Println("preload: mkdir sound-cache:", err)
		return
	}
	seen := map[string]bool{}
	for _, sc := range sched {
		if sc.SoundPath == "" || seen[sc.SoundPath] {
			continue
		}
		seen[sc.SoundPath] = true

		dst := filepath.Join(s.soundDir, filepath.Base(sc.SoundPath))
		if st, err := os.Stat(dst); err == nil && st.Size() > 0 {
			debug.Println("sound sudah di cache:", dst)
			continue
		}
		src := filepath.Join(s.cfg.SoundBase, sc.SoundPath)
		data, err := os.ReadFile(src)
		if err != nil {
			errlg.Printf("preload: baca %s: %v", src, err)
			continue
		}
		if err := os.WriteFile(dst, data, 0755); err != nil {
			errlg.Printf("preload: tulis %s: %v", dst, err)
			continue
		}
		info.Println("sound di-cache:", dst, len(data), "bytes")
	}
}

func (s *Scheduler) heartbeat() {
	s.mu.Lock()
	n := len(s.schedule)
	s.mu.Unlock()
	info.Printf("HEARTBEAT: %s %s | jadwal aktif %d | cache %s",
		time.Now().Weekday().String(), time.Now().Format("15:04:05"), n, s.soundDir)
}