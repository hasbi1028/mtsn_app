package main

import (
	"os"
	"strconv"
	"strings"
)

// osArgs: argumen command line (dipisah agar main.go ringkas).
func osArgs() []string {
	return os.Args
}

// runOneShot: mode sekali putar — dipanggil playback manager sebagai proses anak.
// worker-bel.exe <file>            → putar 1x lalu exit
// worker-bel.exe --repeat N <file> → putar N kali lalu exit
func runOneShot() {
	repeat := 1
	file := ""
	args := osArgs()
	if args[1] == "--repeat" && len(args) >= 4 {
		if n, err := strconv.Atoi(args[2]); err == nil && n > 0 && n <= 10 {
			repeat = n
		}
		file = args[3]
	} else if !strings.HasPrefix(args[1], "-") {
		file = args[1]
	}
	if file == "" {
		errlg.Println("mode sekali: file tidak valid")
		os.Exit(1)
	}
	info.Printf("Mode sekali: putar %s (repeat=%d)", file, repeat)
	if err := playFile(file, repeat); err != nil {
		errlg.Println(err)
		os.Exit(1)
	}
	os.Exit(0)
}