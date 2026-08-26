package main

import (
	"os"
	"strconv"
)

// Config konfigurasi worker-bel SIMAD via env var.
type Config struct {
	DBPath      string // path SQLite local.db (SIMAD)
	SoundBase   string // folder file suara (static/uploads/bel)
	PollSeconds int    // interval cek jadwal (detik)
	APIPort     string // HTTP API port (kontrol dari Go API SIMAD)
	APIKey      string // token X-API-Key (kosong = hanya localhost)
}

func loadConfig() Config {
	cfg := Config{
		DBPath:      getEnv("DB_PATH", "../local.db"),
		SoundBase:   getEnv("SOUND_BASE", "../static/uploads/bel"),
		PollSeconds: 30,
		APIPort:     getEnv("BEL_PORT", "8093"),
		APIKey:      getEnv("BEL_API_KEY", ""),
	}
	if v := os.Getenv("POLL_SECONDS"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			cfg.PollSeconds = n
		}
	}
	return cfg
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}