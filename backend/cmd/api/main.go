package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

type apiServer struct {
	db *sql.DB
}

func toTime(v any) time.Time {
	switch t := v.(type) {
	case int64:
		return time.Unix(t, 0)
	case float64:
		return time.Unix(int64(t), 0)
	case time.Time:
		return t
	case []byte:
		if ts, err := parseGoTimeString(string(t)); err == nil {
			return ts
		}
	case string:
		if ts, err := parseGoTimeString(t); err == nil {
			return ts
		}
	}
	return time.Time{}
}

func parseGoTimeString(sval string) (time.Time, error) {
	if i := strings.Index(sval, " m="); i >= 0 {
		sval = sval[:i] // buang monotonic clock
	}
	for _, layout := range []string{
		"2006-01-02 15:04:05.999999999 -0700 MST",
		"2006-01-02 15:04:05.9999999999 -0700 MST",
		"2006-01-02 15:04:05.999999999 -0700 -0700",
		"2006-01-02 15:04:05",
	} {
		if ts, err := time.ParseInLocation(layout, sval, time.Local); err == nil {
			return ts, nil
		}
	}
	return time.Time{}, fmt.Errorf("unparsable: %s", sval)
}

func main() {
	dsn := os.Getenv("DB_PATH")
	if dsn == "" {
		dsn = "../local.db"
	}
	db, err := sql.Open("sqlite", dsn+"?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)")
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	s := &apiServer{db: db}

	mux := http.NewServeMux()
	// health
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, 200, map[string]any{"status": "ok", "time": time.Now().Format(time.RFC3339)})
	})
	// auth
	mux.HandleFunc("POST /api/login", s.handleLogin)
	mux.HandleFunc("POST /api/logout", s.handleLogout)
	mux.HandleFunc("GET /api/me", s.auth(s.handleMe))
	// ptk
	mux.HandleFunc("GET /api/ptk", s.auth(s.handlePtkList))
	mux.HandleFunc("GET /api/ptk/{id}", s.auth(s.handlePtkDetail))
	// skmt
	mux.HandleFunc("GET /api/skmt", s.auth(s.handleSkmtList))
	// roster
	mux.HandleFunc("GET /api/roster", s.auth(s.handleRoster))
	// dashboard
	mux.HandleFunc("GET /api/skbk", s.auth(s.handleSkbkList))
	mux.HandleFunc("GET /api/skakpt", s.auth(s.handleSkakptList))
	mux.HandleFunc("GET /api/skakpt/bukti/{name}", s.auth(s.handleSkakptBukti))
	mux.HandleFunc("GET /api/siswa", s.auth(s.handleSiswaList))
	mux.HandleFunc("GET /api/siswa/{id}", s.auth(s.handleSiswaDetail))
	mux.HandleFunc("GET /api/siswa/{id}/bansos", s.auth(s.handleSiswaBansos))
	mux.HandleFunc("POST /api/siswa/{id}/foto", s.auth(s.handleSiswaFotoUpload))
	mux.HandleFunc("GET /api/siswa/{id}/kartu.png", s.auth(s.handleSiswaKartuPNG))
	mux.HandleFunc("GET /api/siswa/kartu/list", s.auth(s.handleKartuList))
	mux.HandleFunc("POST /api/siswa/kartu/generate-all", s.auth(s.handleKartuGenerateAll))
	mux.HandleFunc("GET /api/bansos/stats", s.auth(s.handleBansosStats))
	mux.HandleFunc("GET /api/activity", s.auth(s.handleActivityLog))
	mux.HandleFunc("GET /api/bel/status", s.auth(s.handleBelStatus))
	mux.HandleFunc("POST /api/bel/play", s.auth(s.handleBelPlay))
	mux.HandleFunc("POST /api/bel/stop", s.auth(s.handleBelStop))
	mux.HandleFunc("GET /api/bel/jadwal", s.auth(s.handleBelJadwal))
	mux.HandleFunc("POST /api/bel/jadwal", s.auth(s.handleBelJadwalCreate))
	mux.HandleFunc("PUT /api/bel/jadwal/{id}", s.auth(s.handleBelJadwalUpdate))
	mux.HandleFunc("DELETE /api/bel/jadwal/{id}", s.auth(s.handleBelJadwalDelete))
	mux.HandleFunc("POST /api/bel/master", s.auth(s.handleBelMaster))
	mux.HandleFunc("GET /api/bel/suara", s.auth(s.handleBelSuaraList))
	mux.HandleFunc("POST /api/bel/suara", s.auth(s.handleBelSuaraUpload))
	mux.HandleFunc("DELETE /api/bel/suara/{name}", s.auth(s.handleBelSuaraDelete))
	mux.HandleFunc("GET /api/stats", s.auth(s.handleStats))

	addr := ":3730"
	if p := os.Getenv("PORT"); p != "" {
		addr = ":" + p
	}
	log.Printf("[go-api] listening on %s (db: %s)", addr, dsn)
	srv := &http.Server{Addr: addr, Handler: mux, ReadHeaderTimeout: 10 * time.Second}
	log.Fatal(srv.ListenAndServe())
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(v)
}

func fail(w http.ResponseWriter, code int, msg string) {
	writeJSON(w, code, map[string]string{"error": msg})
}

// ---------- auth ----------

func (s *apiServer) auth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := bearer(r)
		if token == "" {
			fail(w, 401, "tidak terautentikasi")
			return
		}
		var uid int
		var expAny any
		err := s.db.QueryRow(`SELECT user_id, expires_at FROM sessions WHERE token = ?`, token).
			Scan(&uid, &expAny)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				fail(w, 401, "sesi tidak valid")
			} else {
				fail(w, 500, err.Error())
			}
			return
		}
		exp := toTime(expAny)
		if exp.Before(time.Now()) {
			fail(w, 401, "sesi kedaluwarsa")
			return
		}
		var uname string
		var role string
		var refID int
		if err := s.db.QueryRow(`SELECT username, COALESCE(role,''), COALESCE(ref_id,0) FROM users WHERE id = ?`, uid).Scan(&uname, &role, &refID); err != nil {
			fail(w, 401, "user tidak ada")
			return
		}
		ctx := context.WithValue(r.Context(), ctxUserKey{}, ctxUserInfo{Username: uname, Role: role, RefID: refID})
		next(w, r.WithContext(ctx))
	}
}

type ctxUserInfo struct {
	Username string
	Role     string
	RefID    int
}

type ctxUserKey struct{}

func userName(r *http.Request) string {
	v, _ := r.Context().Value(ctxUserKey{}).(ctxUserInfo)
	return v.Username
}

func userRole(r *http.Request) string {
	v, _ := r.Context().Value(ctxUserKey{}).(ctxUserInfo)
	return v.Role
}

func userRefID(r *http.Request) int {
	v, _ := r.Context().Value(ctxUserKey{}).(ctxUserInfo)
	return v.RefID
}

func userInfo(r *http.Request) ctxUserInfo {
	v, _ := r.Context().Value(ctxUserKey{}).(ctxUserInfo)
	return v
}

func bearer(r *http.Request) string {
	h := r.Header.Get("Authorization")
	if strings.HasPrefix(h, "Bearer ") {
		return strings.TrimPrefix(h, "Bearer ")
	}
	// fallback: cookie mtsn_session (BFF meneruskan cookie)
	if c, err := r.Cookie("mtsn_session"); err == nil {
		return c.Value
	}
	return ""
}

func (s *apiServer) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fail(w, 400, "body tidak valid")
		return
	}
	var id int
	var hash string
	err := s.db.QueryRow(`SELECT id, password_hash FROM users WHERE username = ?`, req.Username).
		Scan(&id, &hash)
	if err != nil || !verifyPassword(req.Password, hash) {
		fail(w, 401, "username atau kata sandi salah")
		return
	}
	token := newToken()
	_, err = s.db.Exec(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`,
		token, id, time.Now().Add(7*24*time.Hour))
	if err != nil {
		fail(w, 500, "gagal buat sesi")
		return
	}
	writeJSON(w, 200, map[string]any{"token": token, "username": req.Username})
}

func (s *apiServer) handleLogout(w http.ResponseWriter, r *http.Request) {
	t := bearer(r)
	if t != "" {
		s.db.Exec(`DELETE FROM sessions WHERE token = ?`, t)
	}
	writeJSON(w, 200, map[string]string{"status": "ok"})
}

func (s *apiServer) handleMe(w http.ResponseWriter, r *http.Request) {
	info := userInfo(r)
	writeJSON(w, 200, map[string]any{
		"username": info.Username,
		"role":     info.Role,
		"ref_id":   info.RefID,
	})
}

// ---------- data endpoints ----------

func (s *apiServer) handlePtkList(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	filter := r.URL.Query().Get("filter")

	where := []string{"1=1"}
	args := []any{}
	if q != "" {
		where = append(where, `(p.nama LIKE ? OR COALESCE(p.peg_id,'') LIKE ?)`)
		args = append(args, "%"+q+"%", "%"+q+"%")
	}
	switch filter {
	case "belum-sertifikasi":
		where = append(where, `p.sertifikasi = 0 AND p.fungsi = 'Guru'`)
	case "jtm-rendah":
		where = append(where, `(COALESCE(j.mengajar,0)+COALESCE(j.tugas,0)) < 24`)
	case "wali":
		where = append(where, `p.wali_kelas IS NOT NULL`)
	}

	whereClause := strings.Join(where, " AND ")

	// count total
	var total int
	countQ := `SELECT COUNT(*) FROM ptk p LEFT JOIN jtm_semester j ON j.ptk_id = p.id WHERE ` + whereClause
	s.db.QueryRow(countQ, args...).Scan(&total)

	// pagination
	page := 1
	perPage := 20
	if v := r.URL.Query().Get("page"); v != "" {
		if n, err := fmt.Sscanf(v, "%d", &page); n != 1 || err != nil || page < 1 {
			page = 1
		}
	}
	if v := r.URL.Query().Get("per_page"); v != "" {
		if n, err := fmt.Sscanf(v, "%d", &perPage); n != 1 || err != nil || perPage < 1 {
			perPage = 20
		}
	}
	if perPage > 100 {
		perPage = 100
	}
	offset := (page - 1) * perPage

	base := `SELECT p.id, p.nama, p.peg_id, p.fungsi, p.kepegawaian, p.sertifikasi,
		p.kelengkapan, p.wali_kelas, p.jabatan_struktural,
		COALESCE(j.mengajar + j.tugas, NULL) AS total_jtm
	FROM ptk p LEFT JOIN jtm_semester j ON j.ptk_id = p.id`
	query := base + " WHERE " + whereClause + " ORDER BY p.nama LIMIT ? OFFSET ?"
	args = append(args, perPage, offset)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id int64
		var nama, fungsi sql.NullString
		var pegID, kepeg, wali, jabatan sql.NullString
		var sert bool
		var kel, totalJtm sql.NullFloat64
		if err := rows.Scan(&id, &nama, &pegID, &fungsi, &kepeg, &sert, &kel, &wali, &jabatan, &totalJtm); err != nil {
			continue
		}
		out = append(out, map[string]any{
			"id": id, "nama": nama.String, "pegId": pegID.String, "fungsi": fungsi.String,
			"kepegawaian": kepeg.String, "sertifikasi": sert,
			"kelengkapan": kel.Float64, "waliKelas": wali.String,
			"jabatanStruktural": jabatan.String, "totalJtm": totalJtm.Float64,
		})
	}
	writeJSON(w, 200, map[string]any{
		"rows":    out,
		"total":   total,
		"page":    page,
		"perPage": perPage,
	})
}

func nullF(f sql.NullFloat64) any {
	if f.Valid {
		return f.Float64
	}
	return nil
}
func nullS(f sql.NullString) any {
	if f.Valid {
		return f.String
	}
	return nil
}
func nullStr(f sql.NullString) *string {
	if f.Valid {
		return &f.String
	}
	return nil
}

func (s *apiServer) handlePtkDetail(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var nama, fungsi sql.NullString
	var pegID, nip, nik, nuptk, kepeg, wali, jabatan, catatan sql.NullString
	var sert, akt bool
	var kel sql.NullFloat64
	err := s.db.QueryRow(`SELECT nama, peg_id, nip, nik, nuptk, fungsi, kepegawaian,
		sertifikasi, aktivasi, kelengkapan, wali_kelas, jabatan_struktural, catatan
		FROM ptk WHERE id = ?`, id).
		Scan(&nama, &pegID, &nip, &nik, &nuptk, &fungsi, &kepeg, &sert, &akt, &kel, &wali, &jabatan, &catatan)
	if errors.Is(err, sql.ErrNoRows) {
		fail(w, 404, "PTK tidak ditemukan")
		return
	} else if err != nil {
		fail(w, 500, err.Error())
		return
	}

	var meng, tugas, s25a, dash sql.NullFloat64
	s.db.QueryRow(`SELECT mengajar, tugas, total_s25a, dashboard_total FROM jtm_semester WHERE ptk_id = ?`, id).
		Scan(&meng, &tugas, &s25a, &dash)

	skmts := []map[string]any{}
	rows, err := s.db.Query(`SELECT periode, instansi, status, nilai_pembelajaran, nilai_bimbingan FROM skmt_ajuan WHERE ptk_id = ? ORDER BY id DESC`, id)
	if err == nil {
		for rows.Next() {
			var per, ins, st sql.NullString
			var np, nb sql.NullFloat64
			rows.Scan(&per, &ins, &st, &np, &nb)
			skmts = append(skmts, map[string]any{
				"periode": per.String, "instansi": ins.String, "status": st.String,
				"nilaiPembelajaran": nullF(np), "nilaiBimbingan": nullF(nb),
			})
		}
		rows.Close()
	}

	doks := []map[string]any{}
	rows2, _ := s.db.Query(`SELECT jenis, file_path, periode FROM dokumen WHERE ptk_id = ? ORDER BY id`, id)
	if rows2 != nil {
		for rows2.Next() {
			var jenis, path, per sql.NullString
			rows2.Scan(&jenis, &path, &per)
			doks = append(doks, map[string]any{"jenis": jenis.String, "filePath": path.String, "periode": per.String})
		}
		rows2.Close()
	}

	roster := []map[string]any{}
	first := strings.Split(nama.String, ",")[0]
	rows3, _ := s.db.Query(`SELECT hari, jam_ke, kelas, mapel FROM roster WHERE guru_nama LIKE ? `, first+"%")
	if rows3 != nil {
		for rows3.Next() {
			var h, j, k, m sql.NullString
			rows3.Scan(&h, &j, &k, &m)
			roster = append(roster, map[string]any{"hari": h.String, "jamKe": j.String, "kelas": k.String, "mapel": m.String})
		}
		rows3.Close()
	}

	skbks := []map[string]any{}
	rows4, _ := s.db.Query(`SELECT periode, instansi, status, jtm_total, tgl_ajuan FROM skbk_ajuan WHERE ptk_id = ? ORDER BY id DESC`, id)
	if rows4 != nil {
		for rows4.Next() {
			var per, ins, st, tgl sql.NullString
			var jtm sql.NullFloat64
			rows4.Scan(&per, &ins, &st, &jtm, &tgl)
			skbks = append(skbks, map[string]any{
				"periode": per.String, "instansi": ins.String, "status": st.String,
				"jtmTotal": nullF(jtm), "tglAjuan": tgl.String,
			})
		}
		rows4.Close()
	}

	skakpts := []map[string]any{}
	rows5, _ := s.db.Query(`SELECT periode, bulan, status, tgl_ajuan, tgl_verifikasi FROM skakpt WHERE ptk_id = ? ORDER BY id DESC`, id)
	if rows5 != nil {
		for rows5.Next() {
			var per, bul, st, tglA, tglV sql.NullString
			rows5.Scan(&per, &bul, &st, &tglA, &tglV)
			skakpts = append(skakpts, map[string]any{
				"periode": per.String, "bulan": bul.String, "status": st.String,
				"tglAjuan": tglA.String, "tglVerifikasi": tglV.String,
			})
		}
		rows5.Close()
	}

	// Tambah SKBK & SKAKPT PDF jika sudah Disetujui
	namaFile := strings.ReplaceAll(strings.TrimSpace(nama.String), " ", "_")
	namaFile = strings.ReplaceAll(namaFile, ".", "")
	for _, sk := range skbks {
		if sk["status"] == "Disetujui" {
			skbkPath := "/uploads/skbk/" + namaFile + "_SKBK_2026S1.pdf"
			doks = append(doks, map[string]any{"jenis": "SKBK", "filePath": skbkPath, "periode": sk["periode"]})
		}
	}
	for _, sa := range skakpts {
		if sa["status"] == "Disetujui" {
			skakptPath := "/uploads/skakpt/SKAKPT_" + namaFile + "_Juli2026.pdf"
			doks = append(doks, map[string]any{"jenis": "SKAKPT", "filePath": skakptPath, "periode": sa["bulan"]})
		}
	}

	writeJSON(w, 200, map[string]any{
		"id": id, "nama": nama.String, "pegId": nullS(pegID), "nip": nullS(nip),
		"nik": nullS(nik), "nuptk": nullS(nuptk), "fungsi": fungsi.String,
		"kepegawaian": nullS(kepeg), "sertifikasi": sert, "aktivasi": akt,
		"kelengkapan": nullF(kel), "waliKelas": nullS(wali),
		"jabatanStruktural": nullS(jabatan), "catatan": nullS(catatan),
		"jtm": map[string]any{"mengajar": nullF(meng), "tugas": nullF(tugas),
			"totalS25a": nullF(s25a), "dashboardTotal": nullF(dash)},
		"skmt": skmts, "skbk": skbks, "skakpt": skakpts, "dokumen": doks, "roster": roster,
	})
}

func (s *apiServer) handleSkmtList(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(`SELECT s.id, p.nama, s.instansi, s.status,
		s.nilai_pembelajaran, s.nilai_bimbingan,
		(SELECT COUNT(*) FROM dokumen d WHERE d.ptk_id = s.ptk_id) AS ndok
		FROM skmt_ajuan s JOIN ptk p ON p.id = s.ptk_id
		ORDER BY CASE WHEN s.status='Menunggu' THEN 0 WHEN s.status LIKE 'Disetujui%' THEN 1 ELSE 2 END, p.nama`)
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id int64
		var nama, inst, st sql.NullString
		var np, nb, nd sql.NullFloat64
		rows.Scan(&id, &nama, &inst, &st, &np, &nb, &nd)
		out = append(out, map[string]any{
			"ptkId": id, "nama": nama.String, "instansi": inst.String, "status": st.String,
			"nilaiPembelajaran": nullF(np), "nilaiBimbingan": nullF(nb), "jmlDokumen": int(nd.Float64),
		})
	}
	writeJSON(w, 200, out)
}

var hariUrut = `CASE REPLACE(r.hari, CHAR(96), '') WHEN 'SENIN' THEN 1 WHEN 'SELASA' THEN 2 WHEN 'RABU' THEN 3 WHEN 'KAMIS' THEN 4 WHEN 'JUMAT' THEN 5 WHEN 'SABTU' THEN 6 END`
var jamUrut = `CASE r.jam_ke WHEN 'I' THEN 1 WHEN 'II' THEN 2 WHEN 'III' THEN 3 WHEN 'IV' THEN 4 WHEN 'V' THEN 5 WHEN 'VI' THEN 6 WHEN 'VII' THEN 7 WHEN 'VIII' THEN 8 WHEN 'IX' THEN 9 ELSE 99 END`

func (s *apiServer) handleRoster(w http.ResponseWriter, r *http.Request) {
	kelas := r.URL.Query().Get("kelas")
	if kelas == "" {
		kelas = "IXA"
	}
	rows, err := s.db.Query(`SELECT r.hari, r.jam_ke, r.mapel, r.guru_nama FROM roster r
		WHERE r.kelas = ? ORDER BY `+hariUrut+`, `+jamUrut+`, kelas`, kelas)
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var h, j, m, g sql.NullString
		rows.Scan(&h, &j, &m, &g)
		out = append(out, map[string]any{"hari": h.String, "jamKe": j.String, "mapel": m.String, "guru": g.String})
	}
	kelasList := []string{"VIIA", "VIIB", "VIIC", "VIID", "VIIE", "VIIIA", "VIIIB", "VIIIC", "VIIID", "IXA", "IXB", "IXC"}
	writeJSON(w, 200, map[string]any{"kelas": kelas, "daftarKelas": kelasList, "rows": out})
}

func (s *apiServer) handleSkbkList(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(`SELECT s.id, p.nama, s.instansi, s.status, s.jtm_total,
		(SELECT COUNT(*) FROM dokumen d WHERE d.ptk_id = s.ptk_id) AS ndok
		FROM skbk_ajuan s JOIN ptk p ON p.id = s.ptk_id
		ORDER BY CASE WHEN s.status='Belum Diajukan' THEN 0 ELSE 1 END, p.nama`)
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id int64
		var nama, inst, st sql.NullString
		var jtm, nd sql.NullFloat64
		rows.Scan(&id, &nama, &inst, &st, &jtm, &nd)
		out = append(out, map[string]any{
			"ptkId": id, "nama": nama.String, "instansi": inst.String,
			"status": st.String, "jtmTotal": nullF(jtm), "jmlDokumen": int(nd.Float64),
		})
	}
	writeJSON(w, 200, out)
}

func (s *apiServer) handleSkakptList(w http.ResponseWriter, r *http.Request) {
	// Filter bulan (optional). Default: ambil semua bulan, dedupe per PTK per bulan.
	bulanFilter := r.URL.Query().Get("bulan")
	var rows *sql.Rows
	var err error
	if bulanFilter != "" {
		rows, err = s.db.Query(`SELECT COALESCE(s.id,0), p.nama, COALESCE(p.nuptk,'') AS nuptk,
			COALESCE(s.bulan,''), COALESCE(s.status,''), COALESCE(s.tgl_ajuan,'' ), COALESCE(s.detail,'')
			FROM ptk p LEFT JOIN skakpt s ON p.id = s.ptk_id AND s.bulan = ?
			WHERE p.sertifikasi = 1
			ORDER BY p.nama`, bulanFilter)
	} else {
		// Tanpa filter: ambil baris skakpt terbaru per PTK (OR-der by bulan desc)
		rows, err = s.db.Query(`SELECT COALESCE(s.id,0), p.nama, COALESCE(p.nuptk,'') AS nuptk,
			COALESCE(s.bulan,''), COALESCE(s.status,''), COALESCE(s.tgl_ajuan,'' ), COALESCE(s.detail,'')
			FROM ptk p
			LEFT JOIN skakpt s ON p.id = s.ptk_id
				AND s.bulan = (SELECT bulan FROM skakpt s2 WHERE s2.ptk_id = p.id ORDER BY s2.id DESC LIMIT 1)
			WHERE p.sertifikasi = 1
			ORDER BY p.nama`)
	}
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id int64
		var nama, nuptk, bulan, st, tgl, detail sql.NullString
		rows.Scan(&id, &nama, &nuptk, &bulan, &st, &tgl, &detail)
		// Tentukan bulan dari data (default Juli 2026 jika kosong)
		bulanStr := bulan.String
		if bulanStr == "" {
			bulanStr = "Juli 2026"
		}
		// Parse detail JSON (11 indikator)
		var detailObj any
		layak := false
		totalOk := 0
		total := 0
		if detail.String != "" {
			_ = json.Unmarshal([]byte(detail.String), &detailObj)
			if dm, ok := detailObj.(map[string]any); ok {
				if l, ok := dm["layak"].(bool); ok {
					layak = l
				}
				if n, ok := dm["totalOk"].(float64); ok {
					totalOk = int(n)
				}
				if n, ok := dm["total"].(float64); ok {
					total = int(n)
				}
			}
		}
		// PDF filename mengikuti bulan
		cleanName := strings.ReplaceAll(strings.TrimSpace(nama.String), " ", "_")
		cleanName = strings.ReplaceAll(cleanName, ",", "")
		monthSlug := strings.ReplaceAll(bulanStr, " ", "")
		pdfFile := "SKAKPT_" + cleanName + "_" + monthSlug + ".pdf"
		pdfPath := filepath.Join("C:/Users/LENOVO/webapp/mtsn_app/static/uploads/skakpt", pdfFile)
		pdfExists, _ := os.Stat(pdfPath)
		terbit := pdfExists != nil
		// Status: prioritas PDF (sudah terbit) > indikator lengkap > kondisi lama > belum
		status := "Belum Terbit"
		if terbit {
			status = "Sudah Terbit"
		} else if layak && totalOk >= total && total > 0 {
			status = "Indikator Lengkap" // hijau 11/11 tapi SKAKPT belum diterbitkan
		} else if st.String == "Belum Layak" {
			status = "Belum Layak"
		} else if st.String == "Menunggu Verifikasi" {
			status = "Menunggu Verifikasi"
		} else if st.String == "Disetujui" {
			// Fallback kondisi lama (Juli): detail kosong tapi sudah disetujui
			status = "Sudah Terbit"
		}
		out = append(out, map[string]any{
			"ptkId": id, "nama": nama.String, "nuptk": nuptk.String,
			"bulan": bulanStr, "status": status, "tglAjuan": tgl.String,
			"download": terbit, "filename": pdfFile,
			"layak": layak, "totalOk": totalOk, "totalIndikator": total,
			"detail": detailObj,
		})
	}
	writeJSON(w, 200, out)
}

// handleSkakptBukti melayani file screenshot bukti dari output/bukti-skakpt/
func (s *apiServer) handleSkakptBukti(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	// Anti path traversal
	if name == "" || strings.Contains(name, "..") || strings.Contains(name, "/") || strings.Contains(name, "\\") {
		http.NotFound(w, r)
		return
	}
	base := "C:/Users/LENOVO/webapp/mtsn_app/output/bukti-skakpt"
	fp := filepath.Join(base, name)
	if _, err := os.Stat(fp); err != nil {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "image/png")
	http.ServeFile(w, r, fp)
}

func (s *apiServer) handleActivityLog(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(`SELECT a.id, u.username, a.action, a.detail, a.created_at
		FROM activity_log a LEFT JOIN users u ON u.id = a.user_id
		ORDER BY a.created_at DESC LIMIT 50`)
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id int64
		var user, action, detail sql.NullString
		var ts sql.NullFloat64
		rows.Scan(&id, &user, &action, &detail, &ts)
		out = append(out, map[string]any{
			"id": id, "user": user.String, "action": action.String,
			"detail": detail.String, "createdAt": nullF(ts),
		})
	}
	writeJSON(w, 200, out)
}

func (s *apiServer) handleSiswaList(w http.ResponseWriter, r *http.Request) {
	kelas := r.URL.Query().Get("kelas")
	q := r.URL.Query().Get("q")
	nisn := r.URL.Query().Get("nisn")
	ortu := r.URL.Query().Get("ortu")
	rombel := r.URL.Query().Get("rombel")
	status := r.URL.Query().Get("status")

	where := "1=1"
	var args []any
	if kelas != "" {
		where += " AND kelas = ?"
		args = append(args, kelas)
	}
	if rombel != "" {
		where += " AND rombel = ?"
		args = append(args, rombel)
	}
	if status != "" {
		if status == "aktif" {
			where += " AND (status_emis IS NULL OR status_emis LIKE 'Aktif%')"
		} else if status == "nonaktif" {
			where += " AND status_emis = 'Tidak Aktif'"
		} else if status == "tanpa_rombel" {
			where += " AND (rombel IS NULL OR rombel='')"
		}
	}
	if q != "" {
		q = strings.TrimSpace(q)
		where += " AND LOWER(COALESCE(nama,'')) LIKE LOWER(?)"
		like := "%" + q + "%"
		args = append(args, like)
	}
	if nisn != "" {
		nisn = strings.TrimSpace(nisn)
		where += " AND LOWER(COALESCE(nisn,'')) LIKE LOWER(?)"
		args = append(args, "%"+nisn+"%")
	}
	if ortu != "" {
		ortu = strings.TrimSpace(ortu)
		where += " AND (LOWER(COALESCE(ayah,'')) LIKE LOWER(?) OR LOWER(COALESCE(ibu,'')) LIKE LOWER(?))"
		like := "%" + ortu + "%"
		args = append(args, like, like)
	}

	// count total
	var total int
	s.db.QueryRow("SELECT COUNT(*) FROM siswa WHERE "+where, args...).Scan(&total)

	// pagination
	page := 1
	perPage := 20
	if v := r.URL.Query().Get("page"); v != "" {
		if n, err := fmt.Sscanf(v, "%d", &page); n != 1 || err != nil || page < 1 {
			page = 1
		}
	}
	if v := r.URL.Query().Get("per_page"); v != "" {
		if n, err := fmt.Sscanf(v, "%d", &perPage); n != 1 || err != nil || perPage < 1 {
			perPage = 20
		}
	}
	if perPage > 100 {
		perPage = 100
	}
	offset := (page - 1) * perPage

	query := "SELECT id, nis, nisn, nama, jk, kelas, rombel, tempat_lahir, tgl_lahir, ayah, ibu, asal_sekolah, asal_sekolah_npsn, alamat, nik, no_hp, kip_pip, status_emis, sumber_data, bansos_desil, bansos_sembako, bansos_pkh, bansos_pbijk, bansos_kpd, bansos_cek_at FROM siswa WHERE " + where + " ORDER BY CAST(kelas AS INTEGER), rombel, nama LIMIT ? OFFSET ?"
	args = append(args, perPage, offset)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer rows.Close()
	type siswa struct {
		ID              int     `json:"id"`
		NIS             *string `json:"nis"`
		NISN            *string `json:"nisn"`
		Nama            string  `json:"nama"`
		JK              *string `json:"jk"`
		Kelas           *string `json:"kelas"`
		Rombel          *string `json:"rombel"`
		TempatLahir     *string `json:"tempat_lahir"`
		TglLahir        *string `json:"tgl_lahir"`
		Ayah            *string `json:"ayah"`
		Ibu             *string `json:"ibu"`
		AsalSekolah     *string `json:"asal_sekolah"`
		AsalSekolahNPSN *string `json:"asal_sekolah_npsn"`
		Alamat          *string `json:"alamat"`
		NIK             *string `json:"nik"`
		NoHP            *string `json:"no_hp"`
		KipPip          *string `json:"kip_pip"`
		StatusEmis      *string `json:"status_emis"`
		SumberData      *string `json:"sumber_data"`
		BansosDesil     *string `json:"bansos_desil"`
		BansosSembako   *string `json:"bansos_sembako"`
		BansosPKH       *string `json:"bansos_pkh"`
		BansosPBIJK     *string `json:"bansos_pbijk"`
		BansosKPD       *string `json:"bansos_kpd"`
		BansosCekAt     *string `json:"bansos_cek_at"`
	}
	list := []siswa{}
	for rows.Next() {
		var x siswa
		if err := rows.Scan(&x.ID, &x.NIS, &x.NISN, &x.Nama, &x.JK, &x.Kelas, &x.Rombel, &x.TempatLahir, &x.TglLahir, &x.Ayah, &x.Ibu, &x.AsalSekolah, &x.AsalSekolahNPSN, &x.Alamat, &x.NIK, &x.NoHP, &x.KipPip, &x.StatusEmis, &x.SumberData, &x.BansosDesil, &x.BansosSembako, &x.BansosPKH, &x.BansosPBIJK, &x.BansosKPD, &x.BansosCekAt); err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		list = append(list, x)
	}
	// rekap
	type rekap struct {
		Kelas string `json:"kelas"`
		Total int    `json:"total"`
		L     int    `json:"l"`
		P     int    `json:"p"`
	}
	rk := []rekap{}
	rr, _ := s.db.Query("SELECT kelas, COUNT(*), SUM(jk='L'), SUM(jk='P') FROM siswa GROUP BY kelas ORDER BY CAST(kelas AS INTEGER)")
	if rr != nil {
		defer rr.Close()
		for rr.Next() {
			var x rekap
			if rr.Scan(&x.Kelas, &x.Total, &x.L, &x.P) == nil {
				rk = append(rk, x)
			}
		}
	}
	writeJSON(w, 200, map[string]any{
		"rows":    list,
		"rekap":   rk,
		"total":   total,
		"page":    page,
		"perPage": perPage,
	})
}

// ---------- Bansos: siswa detail, bansos detail, stats ----------

// siswaWhereClause builds a WHERE clause + args for role-based siswa filtering.
// Returns (whereClause, args) where whereClause already includes " AND " prefix.
func (s *apiServer) siswaWhereClause(r *http.Request) (string, []any) {
	info := userInfo(r)
	switch info.Role {
	case "siswa":
		return " AND s.id = ?", []any{info.RefID}
	case "guru":
		// guru sees only their wali_kelas rombel
		return " AND s.rombel = REPLACE((SELECT wali_kelas FROM ptk WHERE id = ?), ' ', '')", []any{info.RefID}
	default: // admin, kepsek, staf
		return "", nil
	}
}

// interpretasi computes bansos eligibility fields from desil and pbijk.
func interpretasi(desil sql.NullString, pbijk sql.NullString) (layakPKH, layakPBI, tenggang90 bool, status string) {
	if !desil.Valid || desil.String == "" {
		return false, false, false, "belum_cek"
	}
	d := desil.String
	switch d {
	case "TIDAK DITEMUKAN":
		return false, false, false, "not_found"
	case "BELUM ADA DESIL":
		return false, false, false, "belum_cek"
	}
	// d is "1","2","3","4","5","6-10"
	layakPKH = (d == "1" || d == "2" || d == "3" || d == "4")
	layakPBI = (d == "1" || d == "2" || d == "3" || d == "4" || d == "5")
	pbiActive := pbijk.Valid && strings.Contains(strings.ToUpper(pbijk.String), "YA")
	tenggang90 = pbiActive && (d == "6-10")
	return layakPKH, layakPBI, tenggang90, "ok"
}

// GET /api/siswa/{id}
func (s *apiServer) handleSiswaDetail(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	if idStr == "" {
		fail(w, 400, "id wajib")
		return
	}

	// Role-based access check
	info := userInfo(r)
	switch info.Role {
	case "siswa":
		if idStr != fmt.Sprintf("%d", info.RefID) {
			fail(w, 403, "akses ditolak")
			return
		}
	case "guru":
		// verify siswa is in the guru's rombel
		var rombel string
		err := s.db.QueryRow(`SELECT COALESCE(rombel,'') FROM siswa WHERE id = ?`, idStr).Scan(&rombel)
		if err != nil {
			fail(w, 404, "siswa tidak ditemukan")
			return
		}
		var wali sql.NullString
		s.db.QueryRow(`SELECT wali_kelas FROM ptk WHERE id = ?`, info.RefID).Scan(&wali)
		if !wali.Valid || rombel != strings.ReplaceAll(wali.String, " ", "") {
			fail(w, 403, "akses ditolak")
			return
		}
	}

	type siswaDetail struct {
		ID              int     `json:"id"`
		NIS             *string `json:"nis"`
		NISN            *string `json:"nisn"`
		Nama            string  `json:"nama"`
		JK              *string `json:"jk"`
		Kelas           *string `json:"kelas"`
		Rombel          *string `json:"rombel"`
		TempatLahir     *string `json:"tempat_lahir"`
		TglLahir        *string `json:"tgl_lahir"`
		Ayah            *string `json:"ayah"`
		Ibu             *string `json:"ibu"`
		KerjaAyah       *string `json:"kerja_ayah"`
		KerjaIbu        *string `json:"kerja_ibu"`
		Penghasilan     *int    `json:"penghasilan"`
		AnakKe          *int    `json:"anak_ke"`
		Dari            *int    `json:"dari"`
		AsalSekolah     *string `json:"asal_sekolah"`
		AsalSekolahNPSN *string `json:"asal_sekolah_npsn"`
		Alamat          *string `json:"alamat"`
		NIK             *string `json:"nik"`
		NoHP            *string `json:"no_hp"`
		KipPip          *string `json:"kip_pip"`
		StatusEmis      *string `json:"status_emis"`
		SumberData      *string `json:"sumber_data"`
		// bansos
		Desil   *string `json:"bansos_desil"`
		Sembako *string `json:"bansos_sembako"`
		PKH     *string `json:"bansos_pkh"`
		PBIJK   *string `json:"bansos_pbijk"`
		KPD     *string `json:"bansos_kpd"`
		CekAt   *string `json:"bansos_cek_at"`
		// interpretasi
		LayakPKH     bool   `json:"layak_pkh"`
		LayakPBI     bool   `json:"layak_pbi"`
		Tenggang90   bool   `json:"tenggang_90_hari"`
		StatusBansos string `json:"bansos_status"`
		// foto
		FotoPath *string `json:"foto_path"`
	}

	var d siswaDetail
	var desilS, sembakoS, pkhS, pbijkS, kpdS, cekAtS sql.NullString
	var kerjaAyah, kerjaIbu sql.NullString
	var penghasilan sql.NullInt64
	var anakKe, dari sql.NullInt64

	err := s.db.QueryRow(`SELECT id, nis, nisn, nama, jk, kelas, rombel,
		tempat_lahir, tgl_lahir, ayah, ibu, kerja_ayah, kerja_ibu,
		penghasilan, anak_ke, dari, asal_sekolah, asal_sekolah_npsn, alamat, nik,
		no_hp, kip_pip, status_emis, sumber_data,
		bansos_desil, bansos_sembako, bansos_pkh, bansos_pbijk, bansos_kpd, bansos_cek_at,
		foto_path
		FROM siswa WHERE id = ?`, idStr).Scan(
		&d.ID, &d.NIS, &d.NISN, &d.Nama, &d.JK, &d.Kelas, &d.Rombel,
		&d.TempatLahir, &d.TglLahir, &d.Ayah, &d.Ibu, &kerjaAyah, &kerjaIbu,
		&penghasilan, &anakKe, &dari, &d.AsalSekolah, &d.AsalSekolahNPSN, &d.Alamat, &d.NIK,
		&d.NoHP, &d.KipPip, &d.StatusEmis, &d.SumberData,
		&desilS, &sembakoS, &pkhS, &pbijkS, &kpdS, &cekAtS,
		&d.FotoPath,
	)
	if errors.Is(err, sql.ErrNoRows) {
		fail(w, 404, "siswa tidak ditemukan")
		return
	} else if err != nil {
		fail(w, 500, err.Error())
		return
	}

	d.KerjaAyah = nullStr(kerjaAyah)
	d.KerjaIbu = nullStr(kerjaIbu)
	if penghasilan.Valid {
		v := int(penghasilan.Int64)
		d.Penghasilan = &v
	}
	if anakKe.Valid {
		v := int(anakKe.Int64)
		d.AnakKe = &v
	}
	if dari.Valid {
		v := int(dari.Int64)
		d.Dari = &v
	}
	d.Desil = nullStr(desilS)
	d.Sembako = nullStr(sembakoS)
	d.PKH = nullStr(pkhS)
	d.PBIJK = nullStr(pbijkS)
	d.KPD = nullStr(kpdS)
	d.CekAt = nullStr(cekAtS)

	d.LayakPKH, d.LayakPBI, d.Tenggang90, d.StatusBansos = interpretasi(desilS, pbijkS)

	writeJSON(w, 200, d)
}

// GET /api/siswa/{id}/bansos
func (s *apiServer) handleSiswaBansos(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	if idStr == "" {
		fail(w, 400, "id wajib")
		return
	}

	// Role-based access (same as siswa detail)
	info := userInfo(r)
	switch info.Role {
	case "siswa":
		if idStr != fmt.Sprintf("%d", info.RefID) {
			fail(w, 403, "akses ditolak")
			return
		}
	case "guru":
		var rombel string
		err := s.db.QueryRow(`SELECT COALESCE(rombel,'') FROM siswa WHERE id = ?`, idStr).Scan(&rombel)
		if err != nil {
			fail(w, 404, "siswa tidak ditemukan")
			return
		}
		var wali sql.NullString
		s.db.QueryRow(`SELECT wali_kelas FROM ptk WHERE id = ?`, info.RefID).Scan(&wali)
		if !wali.Valid || rombel != strings.ReplaceAll(wali.String, " ", "") {
			fail(w, 403, "akses ditolak")
			return
		}
	}

	type bansosDetail struct {
		ID         int     `json:"id"`
		Nama       string  `json:"nama"`
		Kelas      *string `json:"kelas"`
		Rombel     *string `json:"rombel"`
		Desil      *string `json:"desil"`
		Sembako    *string `json:"sembako"`
		PKH        *string `json:"pkh"`
		PBIJK      *string `json:"pbijk"`
		KPD        *string `json:"kpd"`
		CekAt      *string `json:"cek_at"`
		LayakPKH   bool    `json:"layak_pkh"`
		LayakPBI   bool    `json:"layak_pbi"`
		Tenggang90 bool    `json:"tenggang_90"`
		StatusText string  `json:"status_text"`
	}

	var d bansosDetail
	var desilS, sembakoS, pkhS, pbijkS, kpdS, cekAtS sql.NullString

	err := s.db.QueryRow(`SELECT id, nama, kelas, rombel,
		bansos_desil, bansos_sembako, bansos_pkh, bansos_pbijk, bansos_kpd, bansos_cek_at
		FROM siswa WHERE id = ?`, idStr).Scan(
		&d.ID, &d.Nama, &d.Kelas, &d.Rombel,
		&desilS, &sembakoS, &pkhS, &pbijkS, &kpdS, &cekAtS,
	)
	if errors.Is(err, sql.ErrNoRows) {
		fail(w, 404, "siswa tidak ditemukan")
		return
	} else if err != nil {
		fail(w, 500, err.Error())
		return
	}

	d.Desil = nullStr(desilS)
	d.Sembako = nullStr(sembakoS)
	d.PKH = nullStr(pkhS)
	d.PBIJK = nullStr(pbijkS)
	d.KPD = nullStr(kpdS)
	d.CekAt = nullStr(cekAtS)

	d.LayakPKH, d.LayakPBI, d.Tenggang90, d.StatusText = interpretasi(desilS, pbijkS)

	writeJSON(w, 200, d)
}

// POST /api/siswa/{id}/foto — upload foto siswa untuk kartu OMI
func (s *apiServer) handleSiswaFotoUpload(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	if idStr == "" {
		fail(w, 400, "id wajib")
		return
	}

	// Verify siswa exists
	var nama string
	err := s.db.QueryRow(`SELECT nama FROM siswa WHERE id = ?`, idStr).Scan(&nama)
	if errors.Is(err, sql.ErrNoRows) {
		fail(w, 404, "siswa tidak ditemukan")
		return
	} else if err != nil {
		fail(w, 500, err.Error())
		return
	}

	// Parse multipart form (max 2MB)
	if err := r.ParseMultipartForm(2 << 20); err != nil {
		fail(w, 400, "gagal parse form: "+err.Error())
		return
	}

	file, header, err := r.FormFile("foto")
	if err != nil {
		fail(w, 400, "field 'foto' wajib")
		return
	}
	defer file.Close()

	// Validate extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif":
	default:
		fail(w, 400, "format tidak didukung (hanya jpg/png/gif)")
		return
	}

	// Validate size (max 2MB)
	if header.Size > 2<<20 {
		fail(w, 400, "ukuran file maksimal 2MB")
		return
	}

	// Create upload directory
	uploadDir := filepath.Join("..", "static", "uploads", "foto_siswa")
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		fail(w, 500, "gagal buat direktori: "+err.Error())
		return
	}

	// Save file: {id}.ext
	filename := idStr + ext
	dstPath := filepath.Join(uploadDir, filename)
	dst, err := os.Create(dstPath)
	if err != nil {
		fail(w, 500, "gagal simpan file: "+err.Error())
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		fail(w, 500, "gagal tulis file: "+err.Error())
		return
	}

	// Update DB
	fotoPath := "uploads/foto_siswa/" + filename
	_, err = s.db.Exec(`UPDATE siswa SET foto_path = ? WHERE id = ?`, fotoPath, idStr)
	if err != nil {
		fail(w, 500, "gagal update database: "+err.Error())
		return
	}

	// Foto berubah → buang cache kartu lama agar di-generate ulang saat download
	os.Remove(kartuPath(idStr))

	writeJSON(w, 200, map[string]any{
		"foto_path": fotoPath,
		"message":   "foto berhasil diupload",
	})
}

// GET /api/bansos/stats
func (s *apiServer) handleBansosStats(w http.ResponseWriter, r *http.Request) {
	filter, args := s.siswaWhereClause(r)
	base := "FROM siswa s WHERE 1=1" + filter

	type catCount struct {
		Category string `json:"category"`
		Total    int    `json:"total"`
	}

	getCount := func(whereExtra string, extraArgs ...any) int {
		var c int
		allArgs := append(args, extraArgs...)
		s.db.QueryRow("SELECT COUNT(*) "+base+whereExtra, allArgs...).Scan(&c)
		return c
	}

	// Total siswa
	totalSiswa := getCount("")

	// Per desil
	desilMap := map[string]int{}
	for _, d := range []string{"1", "2", "3", "4", "5", "6-10", "TIDAK DITEMUKAN", "BELUM ADA DESIL"} {
		desilMap[d] = getCount(" AND s.bansos_desil = ?", d)
	}
	desilMap["null"] = getCount(" AND (s.bansos_desil IS NULL OR s.bansos_desil = '')")

	// Per kelas
	kelasRows, err := s.db.Query("SELECT s.kelas, COUNT(*) "+base+" GROUP BY s.kelas ORDER BY CAST(s.kelas AS INTEGER)", args...)
	var perKelas []catCount
	if err == nil {
		defer kelasRows.Close()
		for kelasRows.Next() {
			var cc catCount
			kelasRows.Scan(&cc.Category, &cc.Total)
			perKelas = append(perKelas, cc)
		}
	}

	// Layak PKH = desil 1-4
	layakPKH := getCount(" AND s.bansos_desil IN ('1','2','3','4')")
	// Layak PBI = desil 1-5
	layakPBI := getCount(" AND s.bansos_desil IN ('1','2','3','4','5')")
	// Tenggang 90 = pbijk contains 'YA' AND desil 6-10
	tenggang90 := getCount(" AND s.bansos_pbijk LIKE '%YA%' AND s.bansos_desil = '6-10'")
	// Sembako aktif = desil 1-4 (sembako follows desil, not column)
	sembakoAktif := layakPKH

	writeJSON(w, 200, map[string]any{
		"total_siswa":   totalSiswa,
		"per_desil":     desilMap,
		"per_kelas":     perKelas,
		"layak_pkh":     layakPKH,
		"layak_pbi":     layakPBI,
		"sembako_aktif": sembakoAktif,
		"tenggang_90":   tenggang90,
		"belum_cek":     desilMap["null"],
		"not_found":     desilMap["TIDAK DITEMUKAN"],
	})
}

// ---- Modul Bel: proxy ke worker-bel SIMAD (127.0.0.1:8093) ----

func (s *apiServer) belURL(path string) string {
	base := os.Getenv("BEL_API")
	if base == "" {
		base = "http://127.0.0.1:8093"
	}
	return base + path
}

func (s *apiServer) belKey() string {
	return os.Getenv("BEL_API_KEY")
}

func (s *apiServer) belProxy(w http.ResponseWriter, method, path string, body io.Reader) {
	req, err := http.NewRequest(method, s.belURL(path), body)
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	if key := s.belKey(); key != "" {
		req.Header.Set("X-API-Key", key)
	}
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		// bel.exe tidak jalan
		writeJSON(w, 200, map[string]any{"ok": false, "offline": true, "error": "Bel service tidak aktif"})
		return
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(resp.Body)
	var out map[string]any
	if jsonErr := json.Unmarshal(data, &out); jsonErr != nil {
		out = map[string]any{"raw": string(data)}
	}
	out["ok"] = resp.StatusCode >= 200 && resp.StatusCode < 300
	writeJSON(w, 200, out)
}

func (s *apiServer) handleBelStatus(w http.ResponseWriter, r *http.Request) {
	s.belProxy(w, "GET", "/api/status", nil)
}

func (s *apiServer) handleBelPlay(w http.ResponseWriter, r *http.Request) {
	s.belProxy(w, "POST", "/api/play", r.Body)
}

func (s *apiServer) handleBelStop(w http.ResponseWriter, r *http.Request) {
	s.belProxy(w, "POST", "/api/stop", nil)
}

func (s *apiServer) handleBelJadwal(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(`SELECT id, hari, jam, jenis, COALESCE(label,''), sound_path, repeat, aktif FROM jam_bel
		ORDER BY CASE hari WHEN 'senin' THEN 1 WHEN 'selasa' THEN 2 WHEN 'rabu' THEN 3
		WHEN 'kamis' THEN 4 WHEN 'jumat' THEN 5 WHEN 'sabtu' THEN 6 ELSE 7 END, jam`)
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	defer rows.Close()
	type Jadwal struct {
		ID        string `json:"id"`
		Hari      string `json:"hari"`
		Jam       string `json:"jam"`
		Jenis     string `json:"jenis"`
		Label     string `json:"label"`
		SoundPath string `json:"sound_path"`
		Repeat    int    `json:"repeat"`
		Aktif     int    `json:"aktif"`
	}
	all := []Jadwal{}
	for rows.Next() {
		var x Jadwal
		var h, j, t, l, sp sql.NullString
		var rp, ak int
		rows.Scan(&x.ID, &h, &j, &t, &l, &sp, &rp, &ak)
		x.Hari, x.Jam, x.Jenis, x.Label, x.SoundPath, x.Repeat, x.Aktif = h.String, j.String, t.String, l.String, sp.String, rp, ak
		all = append(all, x)
	}
	hariIni := strings.ToLower(time.Now().Format("Monday"))
	hm := map[string]string{"monday": "senin", "tuesday": "selasa", "wednesday": "rabu",
		"thursday": "kamis", "friday": "jumat", "saturday": "sabtu", "sunday": "minggu"}
	hariIniID := hm[hariIni]
	hariRows := []Jadwal{}
	for _, x := range all {
		if x.Hari == hariIniID {
			hariRows = append(hariRows, x)
		}
	}
	writeJSON(w, 200, map[string]any{
		"hari_ini":        hariIniID,
		"jadwal_hari_ini": hariRows,
		"semua":           all,
	})
}

func (s *apiServer) handleBelJadwalCreate(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Hari      string `json:"hari"`
		Jam       string `json:"jam"`
		Jenis     string `json:"jenis"`
		Label     string `json:"label"`
		SoundPath string `json:"sound_path"`
		Repeat    int    `json:"repeat"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fail(w, 400, "body JSON tidak valid")
		return
	}
	req.Hari = strings.ToLower(strings.TrimSpace(req.Hari))
	req.Jam = strings.TrimSpace(req.Jam)
	req.Jenis = strings.ToLower(strings.TrimSpace(req.Jenis))
	if req.Hari == "" || req.Jam == "" || req.Jenis == "" {
		fail(w, 400, "hari, jam, jenis wajib diisi")
		return
	}
	validHari := map[string]bool{"senin": true, "selasa": true, "rabu": true, "kamis": true, "jumat": true, "sabtu": true, "minggu": true}
	if !validHari[req.Hari] {
		fail(w, 400, "hari tidak valid")
		return
	}
	if matched, _ := regexp.MatchString(`^\d{2}:\d{2}$`, req.Jam); !matched {
		fail(w, 400, "jam harus format HH:MM")
		return
	}
	if req.Repeat < 1 {
		req.Repeat = 2
	}
	if req.Label == "" {
		req.Label = req.Jenis
	}
	id := fmt.Sprintf("jb-%d", time.Now().UnixMilli())
	_, err := s.db.Exec(`INSERT INTO jam_bel (id, hari, jam, jenis, label, sound_path, repeat, aktif)
		VALUES (?,?,?,?,?,?,?,1)`, id, req.Hari, req.Jam, req.Jenis, req.Label, req.SoundPath, req.Repeat)
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true, "id": id})
}

func (s *apiServer) handleBelJadwalUpdate(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req struct {
		Hari      string `json:"hari"`
		Jam       string `json:"jam"`
		Jenis     string `json:"jenis"`
		Label     string `json:"label"`
		SoundPath string `json:"sound_path"`
		Repeat    int    `json:"repeat"`
		Aktif     *int   `json:"aktif"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fail(w, 400, "body JSON tidak valid")
		return
	}
	// toggle aktif saja
	if req.Aktif != nil && req.Hari == "" {
		res, err := s.db.Exec(`UPDATE jam_bel SET aktif = ?, updated_at = datetime('now','localtime') WHERE id = ?`, *req.Aktif, id)
		if err != nil {
			fail(w, 500, err.Error())
			return
		}
		n, _ := res.RowsAffected()
		if n == 0 {
			fail(w, 404, "jadwal tidak ditemukan")
			return
		}
		writeJSON(w, 200, map[string]any{"ok": true})
		return
	}
	req.Hari = strings.ToLower(strings.TrimSpace(req.Hari))
	req.Jam = strings.TrimSpace(req.Jam)
	if req.Repeat < 1 {
		req.Repeat = 2
	}
	_, err := s.db.Exec(`UPDATE jam_bel SET hari=?, jam=?, jenis=?, label=?, sound_path=?, repeat=?, updated_at=datetime('now','localtime') WHERE id=?`,
		req.Hari, req.Jam, req.Jenis, req.Label, req.SoundPath, req.Repeat, id)
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (s *apiServer) handleBelJadwalDelete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	_, err := s.db.Exec(`DELETE FROM jam_bel WHERE id = ?`, id)
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (s *apiServer) handleBelMaster(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Enabled bool `json:"enabled"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fail(w, 400, "body JSON tidak valid")
		return
	}
	v := "0"
	if req.Enabled {
		v = "1"
	}
	if _, err := s.db.Exec(`INSERT INTO bel_settings (key, value) VALUES ('bel_master', ?)
		ON CONFLICT(key) DO UPDATE SET value = excluded.value`, v); err != nil {
		fail(w, 500, err.Error())
		return
	}
	// beri tahu worker agar langsung berlaku (tanpa nunggu poll)
	body := strings.NewReader(fmt.Sprintf(`{"enabled":%v}`, req.Enabled))
	req2, _ := http.NewRequest("POST", s.belURL("/api/master"), body)
	if key := s.belKey(); key != "" {
		req2.Header.Set("X-API-Key", key)
	}
	req2.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req2)
	if err == nil {
		resp.Body.Close()
	}
	writeJSON(w, 200, map[string]any{"ok": true, "master": req.Enabled})
}

func (s *apiServer) belSoundDir() string {
	if d := os.Getenv("BEL_SOUND_DIR"); d != "" {
		return d
	}
	return "C:/Users/LENOVO/webapp/mtsn_app/static/uploads/bel"
}

func (s *apiServer) handleBelSuaraList(w http.ResponseWriter, r *http.Request) {
	dir := s.belSoundDir()
	entries, err := os.ReadDir(dir)
	if err != nil {
		writeJSON(w, 200, map[string]any{"files": []any{}})
		return
	}
	type Suara struct {
		Name   string `json:"name"`
		Size   int64  `json:"size"`
		UsedBy int    `json:"used_by"`
	}
	files := []Suara{}
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		n := strings.ToLower(e.Name())
		if !strings.HasSuffix(n, ".mp3") && !strings.HasSuffix(n, ".wav") && !strings.HasSuffix(n, ".m4a") && !strings.HasSuffix(n, ".wma") {
			continue
		}
		info, _ := e.Info()
		var used int
		s.db.QueryRow(`SELECT COUNT(*) FROM jam_bel WHERE aktif = 1 AND sound_path = ?`, e.Name()).Scan(&used)
		files = append(files, Suara{Name: e.Name(), Size: info.Size(), UsedBy: used})
	}
	writeJSON(w, 200, map[string]any{"files": files})
}

func (s *apiServer) handleBelSuaraUpload(w http.ResponseWriter, r *http.Request) {
	// Maks 10 MB
	r.Body = http.MaxBytesReader(w, r.Body, 10<<20)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		fail(w, 400, "upload terlalu besar (maks 10 MB) atau format salah")
		return
	}
	file, hdr, err := r.FormFile("file")
	if err != nil {
		fail(w, 400, "field 'file' wajib ada")
		return
	}
	defer file.Close()

	name := filepath.Base(hdr.Filename)
	ext := strings.ToLower(filepath.Ext(name))
	validExt := map[string]bool{".mp3": true, ".wav": true, ".m4a": true, ".wma": true}
	if !validExt[ext] {
		fail(w, 400, "format harus mp3/wav/m4a/wma")
		return
	}
	if strings.ContainsAny(name, `/\`) || strings.HasPrefix(name, ".") {
		fail(w, 400, "nama file tidak valid")
		return
	}

	dir := s.belSoundDir()
	if err := os.MkdirAll(dir, 0755); err != nil {
		fail(w, 500, err.Error())
		return
	}
	dst, err := os.Create(filepath.Join(dir, name))
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	defer dst.Close()
	n, err := io.Copy(dst, file)
	if err != nil {
		fail(w, 500, "gagal menulis: "+err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true, "name": name, "size": n})
}

func (s *apiServer) handleBelSuaraDelete(w http.ResponseWriter, r *http.Request) {
	name := r.PathValue("name")
	name = filepath.Base(name)
	ext := strings.ToLower(filepath.Ext(name))
	validExt := map[string]bool{".mp3": true, ".wav": true, ".m4a": true, ".wma": true}
	if !validExt[ext] || strings.ContainsAny(name, `/\`) {
		fail(w, 400, "nama file tidak valid")
		return
	}
	var used int
	s.db.QueryRow(`SELECT COUNT(*) FROM jam_bel WHERE sound_path = ?`, name).Scan(&used)
	if used > 0 {
		fail(w, 409, fmt.Sprintf("file dipakai %d jadwal — nonaktifkan/ubah jadwal dulu", used))
		return
	}
	path := filepath.Join(s.belSoundDir(), name)
	if _, err := os.Stat(path); os.IsNotExist(err) {
		fail(w, 404, "file tidak ditemukan")
		return
	}
	if err := os.Remove(path); err != nil {
		fail(w, 500, err.Error())
		return
	}
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (s *apiServer) handleStats(w http.ResponseWriter, r *http.Request) {
	get := func(q string, args ...any) int64 {
		var c int64
		s.db.QueryRow(q, args...).Scan(&c)
		return c
	}
	stats := map[string]int64{
		"totalPtk":         get(`SELECT COUNT(*) FROM ptk`),
		"guru":             get(`SELECT COUNT(*) FROM ptk WHERE fungsi='Guru'`),
		"sertifikasi":      get(`SELECT COUNT(*) FROM ptk WHERE sertifikasi=1`),
		"belumSertifikasi": get(`SELECT COUNT(*) FROM ptk WHERE sertifikasi=0 AND fungsi='Guru'`),
		"jtmDiBawah24":     get(`SELECT COUNT(*) FROM jtm_semester WHERE (COALESCE(mengajar,0)+COALESCE(tugas,0)) < 24`),
		"skmtDisetujui":    get(`SELECT COUNT(DISTINCT ptk_id) FROM skmt_ajuan WHERE status LIKE 'Disetujui%'`),
		"skmtMenunggu":     get(`SELECT COUNT(*) FROM skmt_ajuan WHERE status='Menunggu'`),
		"rosterSlot":       get(`SELECT COUNT(*) FROM roster`),
		"dokumen":          get(`SELECT COUNT(*) FROM dokumen`),
		"skbkDisetujui":    get(`SELECT COUNT(DISTINCT ptk_id) FROM skbk_ajuan WHERE status='Sudah Diajukan'`),
		"skbkMenunggu":     get(`SELECT COUNT(*) FROM skbk_ajuan WHERE status='Belum Diajukan'`),
		"skakptDiajukan":   get(`SELECT COUNT(*) FROM skakpt WHERE status='Menunggu Verifikasi'`),
		"skakptMenunggu":   get(`SELECT COUNT(*) FROM skakpt WHERE status='Menunggu Verifikasi'`),
	}
	writeJSON(w, 200, stats)
}
