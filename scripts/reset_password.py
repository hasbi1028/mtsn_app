import hashlib, os, sys, sqlite3

DB = "C:/Users/LENOVO/webapp/mtsn_app/local.db"

def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    key = hashlib.scrypt(password.encode(), salt=salt.encode(), n=16384, r=8, p=1, dklen=64)
    return f"{salt}:{key.hex()}"

def main():
    if len(sys.argv) < 3:
        print("Usage: python reset_password.py <username> <new_password>")
        print("Example: python reset_password.py hasbi admin123")
        sys.exit(1)
    
    username = sys.argv[1]
    password = sys.argv[2]
    hashed = hash_password(password)
    
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    
    cur.execute("UPDATE users SET password_hash = ? WHERE username = ?", (hashed, username))
    if cur.rowcount == 0:
        print(f"User '{username}' tidak ditemukan!")
        conn.close()
        sys.exit(1)
    
    conn.commit()
    conn.close()
    print(f"Password untuk '{username}' berhasil direset!")
    print(f"Username: {username}")
    print(f"Password: {password}")

if __name__ == "__main__":
    main()
