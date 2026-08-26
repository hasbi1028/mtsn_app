package main

import (
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"sync"
	"syscall"

	"golang.org/x/sys/windows"
)

// Playback manager berbasis PROSES ANAK.
//
// Mengapa proses anak, bukan MCI async in-process?
//   - "play bell" async (tanpa wait) + "stop bell"/"close bell" dari thread lain
//     tidak bisa dihentikan dengan andal untuk MP3 (device mpegvideo) — audio
//     lanjut meski status sudah "stopped" (dibuktikan saat uji tombol Stop).
//   - Pemutaran sync "play bell wait" (di bel.exe mode sekali) SELALU benar
//     sampai selesai, dan dihentikan secara terjamin dengan membunuh prosesnya
//     (TerminateProcess) — audio berhenti seketika.
//
// Konsekuensi: tiap pemutaran spawn 1 proses bel.exe (startup ~50-150ms) —
// tidak masalah untuk bel sekolah.

type playbackState struct {
	mu   sync.Mutex
	cmd  *exec.Cmd
	path string
	done chan struct{}
}

var pb = &playbackState{}

// startPlayback spawn proses anak yang memutar file. Mengembalikan error
// hanya kalau sedang ada pemutaran lain dan force=false.
func startPlayback(path string, repeat int, force bool) error {
	pb.mu.Lock()
	defer pb.mu.Unlock()

	if runningLocked() {
		if !force {
			return fmt.Errorf("suara lain sedang diputar: %s (stop dulu)", pb.path)
		}
		killLocked()
	}

	exe, err := os.Executable()
	if err != nil {
		return fmt.Errorf("lokasi bel.exe tidak diketahui: %v", err)
	}

	args := []string{}
	if repeat > 1 {
		args = append(args, "--repeat", strconv.Itoa(repeat))
	}
	args = append(args, path)

	cmd := exec.Command(exe, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	// Windows: spawn TANPA console window (jendela CLI tidak muncul saat putar).
	// Suara tetap normal — MCI tidak butuh console.
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: windows.CREATE_NO_WINDOW,
	}
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("gagal spawn pemutar: %v", err)
	}

	pb.cmd = cmd
	pb.path = path
	pb.done = make(chan struct{})
	done := pb.done

	info.Printf("PLAYBACK START: %s (repeat=%d, pid=%d)", path, repeat, cmd.Process.Pid)
	go func(c *exec.Cmd, d chan struct{}) {
		err := c.Wait()
		close(d)
		pb.mu.Lock()
		if pb.cmd == c {
			pb.cmd = nil
			pb.path = ""
		}
		pb.mu.Unlock()
		if err != nil {
			errlg.Printf("pemutar selesai dengan error: %v", err)
		} else {
			info.Println("PLAYBACK SELESAI")
		}
	}(cmd, done)
	return nil
}

// stopPlayback bunuh proses pemutar (TerminateProcess) — audio berhenti
// seketika. Idempotent.
func stopPlayback() {
	pb.mu.Lock()
	defer pb.mu.Unlock()
	if !runningLocked() {
		return
	}
	info.Println("PLAYBACK STOP: kill pid", pb.cmd.Process.Pid, pb.path)
	killLocked()
}

// statusPlayback: kondisi pemutaran saat ini.
func statusPlayback() (playing bool, path string) {
	pb.mu.Lock()
	defer pb.mu.Unlock()
	if !runningLocked() {
		return false, ""
	}
	return true, pb.path
}

// runningLocked: panggil dengan pb.mu terkunci.
func runningLocked() bool {
	if pb.cmd == nil {
		return false
	}
	select {
	case <-pb.done:
		return false
	default:
		return true
	}
}

// killLocked: panggil dengan pb.mu terkunci.
func killLocked() {
	if pb.cmd == nil {
		return
	}
	if pb.cmd.Process != nil {
		_ = pb.cmd.Process.Kill() // TerminateProcess — audio pasti berhenti
	}
	pb.cmd = nil
	pb.path = ""
	pb.done = nil
}
