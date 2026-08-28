#!/usr/bin/env python3
"""
Migration v24: Multi-role auth system
- Adds columns to users table (ref_id, is_active, last_login, updated_at)
- Creates ortu table
- Creates siswa_ortu junction table
- Seeds users for all roles (kepsek, staf, guru, siswa)
- Uses scrypt hash matching Go backend (auth.go)
"""

import hashlib
import os
import shutil
import sqlite3
import secrets
import sys
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'local.db')
BACKUP_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
BACKUP_NAME = 'backup_pra_multirole_20260828.db'

# ─── scrypt hash matching Go backend (auth.go) ──────────────────────
# Go code: scrypt.Key(password, salt, 16384, 8, 1, 64)
# Format: salt:hash (both hex)

def hash_password(password: str) -> str:
    """Generate salt:scrypt_hash matching Go backend format."""
    salt = secrets.token_hex(16)  # 16 bytes = 32 hex chars
    dk = hashlib.scrypt(
        password.encode('utf-8'),
        salt=salt.encode('utf-8'),
        n=16384, r=8, p=1, dklen=64
    )
    return f"{salt}:{dk.hex()}"


def main():
    errors = []

    # ─── 1. Backup ────────────────────────────────────────────────
    print("=" * 60)
    print("MIGRATION v24: Multi-Role Auth System")
    print("=" * 60)

    os.makedirs(BACKUP_DIR, exist_ok=True)
    backup_path = os.path.join(BACKUP_DIR, BACKUP_NAME)
    shutil.copy2(DB_PATH, backup_path)
    print(f"[OK] Backup: {backup_path}")

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("PRAGMA foreign_keys = ON")

    # ─── 2. ALTER TABLE users ─────────────────────────────────────
    migrations = [
        ("ADD COLUMN ref_id INTEGER",        "users.ref_id"),
        ("ADD COLUMN is_active INTEGER DEFAULT 1", "users.is_active"),
        ("ADD COLUMN last_login TEXT",       "users.last_login"),
        ("ADD COLUMN updated_at TEXT",       "users.updated_at"),
    ]

    for sql, desc in migrations:
        try:
            cur.execute(f"ALTER TABLE users {sql}")
            print(f"[OK] ALTER TABLE users {desc}")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e).lower():
                print(f"[SKIP] {desc} already exists")
            else:
                errors.append(f"ALTER users {desc}: {e}")
                print(f"[ERR] {desc}: {e}")

    # ─── 3. CREATE TABLE ortu ─────────────────────────────────────
    try:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS ortu (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nama TEXT NOT NULL,
                nik TEXT,
                no_hp TEXT,
                alamat TEXT,
                pekerjaan TEXT,
                created_at TEXT DEFAULT (datetime('now','localtime'))
            )
        """)
        print("[OK] CREATE TABLE ortu")
    except sqlite3.OperationalError as e:
        errors.append(f"CREATE ortu: {e}")
        print(f"[ERR] CREATE ortu: {e}")

    # ─── 4. CREATE TABLE siswa_ortu ───────────────────────────────
    try:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS siswa_ortu (
                siswa_id INTEGER REFERENCES siswa(id),
                ortu_id INTEGER REFERENCES ortu(id),
                hubungan TEXT,
                PRIMARY KEY (siswa_id, ortu_id)
            )
        """)
        print("[OK] CREATE TABLE siswa_ortu")
    except sqlite3.OperationalError as e:
        errors.append(f"CREATE siswa_ortu: {e}")
        print(f"[ERR] CREATE siswa_ortu: {e}")

    # ─── 5. CREATE TABLE schema_migrations ────────────────────────
    try:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                applied_at TEXT DEFAULT (datetime('now','localtime'))
            )
        """)
        print("[OK] CREATE TABLE schema_migrations")
    except sqlite3.OperationalError as e:
        errors.append(f"CREATE schema_migrations: {e}")
        print(f"[ERR] CREATE schema_migrations: {e}")

    # ─── 6. Mark existing user as active ──────────────────────────
    cur.execute("UPDATE users SET is_active = 1 WHERE is_active IS NULL")
    print(f"[OK] Marked {cur.rowcount} existing users as active")

    # ─── 7. Seed users ────────────────────────────────────────────
    print("\n--- Seeding users ---")
    seeded = {}

    # 7a. KEPSEK
    try:
        cur.execute(
            "SELECT id FROM users WHERE username = 'kepsek'"
        )
        if not cur.fetchone():
            cur.execute(
                "INSERT INTO users (username, password_hash, role, is_active) VALUES (?, ?, 'kepsek', 1)",
                ('kepsek', hash_password('kepsek123'))
            )
            seeded['kepsek'] = 1
            print("[OK] Created user: kepsek/kepsek123")
        else:
            print("[SKIP] User 'kepsek' already exists")
            seeded['kepsek'] = 0
    except Exception as e:
        errors.append(f"Seed kepsek: {e}")
        print(f"[ERR] Seed kepsek: {e}")

    # 7b. STAF
    try:
        cur.execute(
            "SELECT id FROM users WHERE username = 'staf'"
        )
        if not cur.fetchone():
            cur.execute(
                "INSERT INTO users (username, password_hash, role, is_active) VALUES (?, ?, 'staf', 1)",
                ('staf', hash_password('staf123'))
            )
            seeded['staf'] = 1
            print("[OK] Created user: staf/staf123")
        else:
            print("[SKIP] User 'staf' already exists")
            seeded['staf'] = 0
    except Exception as e:
        errors.append(f"Seed staf: {e}")
        print(f"[ERR] Seed staf: {e}")

    # 7c. GURU (all ptk where fungsi='Guru')
    guru_count = 0
    try:
        cur.execute("SELECT id, nip, nama FROM ptk WHERE fungsi = 'Guru' ORDER BY id")
        guru_rows = cur.fetchall()
        for ptk_id, nip, nama in guru_rows:
            username = (nip and nip.strip()) or f"guru_{ptk_id}"
            # Check if user already exists
            cur.execute("SELECT id FROM users WHERE username = ?", (username,))
            if cur.fetchone():
                continue
            cur.execute(
                "INSERT INTO users (username, password_hash, role, ref_id, is_active) VALUES (?, ?, 'guru', ?, 1)",
                (username, hash_password('guru123'), ptk_id)
            )
            guru_count += 1
        seeded['guru'] = guru_count
        print(f"[OK] Created {guru_count} guru users (password: guru123)")
    except Exception as e:
        errors.append(f"Seed guru: {e}")
        print(f"[ERR] Seed guru: {e}")

    # 7d. SISWA (for each siswa with NISN, username=NISN, password=NIK)
    siswa_count = 0
    siswa_skipped = 0
    try:
        cur.execute("SELECT id, nisn, nik, nama FROM siswa WHERE nisn IS NOT NULL AND nisn != '' ORDER BY id")
        siswa_rows = cur.fetchall()
        for siswa_id, nisn, nik, nama in siswa_rows:
            if not nik or not nik.strip():
                siswa_skipped += 1
                continue
            username = nisn.strip()
            # Check if user already exists
            cur.execute("SELECT id FROM users WHERE username = ?", (username,))
            if cur.fetchone():
                continue
            cur.execute(
                "INSERT INTO users (username, password_hash, role, ref_id, is_active) VALUES (?, ?, 'siswa', ?, 1)",
                (username, hash_password(nik.strip()), siswa_id)
            )
            siswa_count += 1
        seeded['siswa'] = siswa_count
        print(f"[OK] Created {siswa_count} siswa users (skipped {siswa_skipped} without NIK)")
    except Exception as e:
        errors.append(f"Seed siswa: {e}")
        print(f"[ERR] Seed siswa: {e}")

    # ─── 8. Record migration ──────────────────────────────────────
    try:
        cur.execute(
            "INSERT OR IGNORE INTO schema_migrations (version) VALUES (24)"
        )
        print("[OK] Recorded schema migration v24")
    except Exception as e:
        errors.append(f"Record migration: {e}")
        print(f"[ERR] Record migration: {e}")

    conn.commit()

    # ─── 9. Verify ────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("VERIFICATION")
    print("=" * 60)

    cur.execute("SELECT role, COUNT(*) FROM users GROUP BY role ORDER BY role")
    role_counts = cur.fetchall()
    print("\nUsers by role:")
    for role, count in role_counts:
        print(f"  {role:10s} : {count:4d}")

    cur.execute("SELECT COUNT(*) FROM users")
    total = cur.fetchone()[0]
    print(f"  {'TOTAL':10s} : {total:4d}")

    # Show sample users per role
    print("\nSample users (2 per role):")
    cur.execute("SELECT username, role, ref_id, is_active FROM users ORDER BY role, username LIMIT 20")
    for row in cur.fetchall():
        print(f"  {row}")

    # ─── 10. Errors summary ───────────────────────────────────────
    if errors:
        print(f"\n[WARN] {len(errors)} error(s):")
        for e in errors:
            print(f"  - {e}")
    else:
        print("\n[OK] No errors encountered")

    conn.close()
    print("\nDone.")


if __name__ == '__main__':
    main()
