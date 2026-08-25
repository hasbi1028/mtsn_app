import os, re, json
import pymupdf

d = r"C:\Users\LENOVO\webapp\mtsn_app\static\uploads\skmt"
out = {}
for f in sorted(os.listdir(d)):
    if not f.endswith(".pdf"): continue
    doc = pymupdf.open(os.path.join(d, f))
    text = "\n".join(p.get_text() for p in doc)
    doc.close()
    g = lambda pat: (re.search(pat, text) or [None]) and (m.group(1).strip() if (m := re.search(pat, text)) else None)
    out[f] = {
        "nama": g(r"Nama Lengkap\s*\n(.+)"),
        "nip": g(r"NIP\s*\n(\d+)"),
        "tgl_lahir": g(r"Tgl Lahir\s*\n(.+)"),
        "kelamin": (lambda: (re.search(r"Laki - laki|Perempuan", text) or [None]) and re.search(r"Laki - laki|Perempuan", text).group(0))(),
        "tmt_guru": g(r"TMT Guru\s*\n(.+)"),
        "gol": g(r"Gol\.\s*\n(\S+)"),
        "mapel_sert": g(r"Mapel sertifikasi\s*\n(.+)"),
        "jabatan": g(r"Jabatan\s*\n(.+)"),
    }
print(json.dumps(out, indent=1, ensure_ascii=False))
