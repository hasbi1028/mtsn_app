package main

import (
	"crypto/rand"
	"encoding/hex"
	"strings"

	"golang.org/x/crypto/scrypt"
)

func newToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// hash format: salt:hash (hex, scrypt N=32768 r=8 p=1 keyLen=64) — N=16384 (Node default)
func verifyPassword(password, stored string) bool {
	parts := strings.SplitN(stored, ":", 2)
	if len(parts) != 2 {
		return false
	}
	salt, want := parts[0], parts[1]
	got, err := scrypt.Key([]byte(password), []byte(salt), 16384, 8, 1, 64)
	if err != nil {
		return false
	}
	return hex.EncodeToString(got) == want
}
