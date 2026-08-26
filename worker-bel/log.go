package main

import (
	"log"
	"os"
)

var (
	info  = log.New(os.Stdout, "[INFO]  ", log.Ldate|log.Ltime|log.Lmicroseconds)
	debug = log.New(os.Stdout, "[DEBUG] ", log.Ldate|log.Ltime|log.Lmicroseconds)
	errlg = log.New(os.Stderr, "[ERROR] ", log.Ldate|log.Ltime|log.Lmicroseconds)
)