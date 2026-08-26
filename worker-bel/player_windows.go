package main

import (
	"fmt"
	"os"
	"strings"
	"syscall"
	"unsafe"
)

var (
	winmm      = syscall.NewLazyDLL("winmm.dll")
	mciSendStr = winmm.NewProc("mciSendStringW")
)

// playFile memutar file audio via MCI Windows (winmm.dll).
// Mendukung format apa pun yang Windows Media Player bisa: WAV, MP3, M4A, WMA, dll.
// repeat >= 1: berapa kali diputar berurutan.
func playFile(path string, repeat int) error {
	if _, err := os.Stat(path); err != nil {
		return fmt.Errorf("file tidak ditemukan: %s", path)
	}
	if repeat < 1 {
		repeat = 1
	}
	for i := 1; i <= repeat; i++ {
		info.Printf("MCI play %s (iterasi %d/%d)", path, i, repeat)
		if err := mciOpen(path); err != nil {
			return err
		}
		if err := mciPlay(); err != nil {
			mciClose()
			return err
		}
		mciClose()
	}
	return nil
}

func mciOpen(path string) error {
	mci("close bell") // bersihkan alias kalau masih terpakai
	cmd := fmt.Sprintf(`open "%s" alias bell`, path)
	return mciChecked(cmd)
}

func mciPlay() error {
	return mciChecked("play bell wait")
}

func mciClose() {
	mci("close bell")
}

func mciChecked(cmd string) error {
	p, err := syscall.UTF16PtrFromString(cmd)
	if err != nil {
		return err
	}
	r1, _, _ := mciSendStr.Call(uintptr(unsafe.Pointer(p)), 0, 0, 0)
	if r1 != 0 {
		return fmt.Errorf("MCI error code %d pada: %s", r1, truncate(cmd, 80))
	}
	return nil
}

func mci(cmd string) {
	p, err := syscall.UTF16PtrFromString(cmd)
	if err != nil {
		return
	}
	mciSendStr.Call(uintptr(unsafe.Pointer(p)), 0, 0, 0)
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return strings.TrimSpace(s[:n]) + "..."
}
