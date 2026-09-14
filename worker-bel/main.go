package main

// Worker bel sekolah SIMAD — MTsN 2 Kolaka Utara.
//
// Porting dari project webapp/bel, tapi MANDIRI:
//   - jadwal dibaca dari SQLite SIMAD (local.db, tabel jam_bel)
//   - suara dari static/uploads/bel (SIMAD)
//   - master switch dari local.db (tabel bel_settings)
//
// Mode sekali (dipakai playback manager sebagai proses anak):
//   worker-bel.exe <file>            → putar 1x lalu exit
//   worker-bel.exe --repeat N <file> → putar N kali lalu exit

func main() {
	if len(osArgs()) > 1 {
		runOneShot()
		return
	}

	cfg := loadConfig()
	info.Printf("Worker Bel SIMAD START (db=%s sound=%s poll=%ds api=127.0.0.1:%s)",
		cfg.DBPath, cfg.SoundBase, cfg.PollSeconds, cfg.APIPort)

	if cfg.APIKey == "" {
		errlg.Println("PERINGATAN: BEL_API_KEY kosong — API hanya menerima localhost")
	}
	s := NewScheduler(cfg)
	apiSrv := startAPIServer(cfg.APIPort, cfg.APIKey, cfg.SoundBase, "sound-cache", s.SoundUsage)
	defer apiSrv.Close()

	s.Run()
}