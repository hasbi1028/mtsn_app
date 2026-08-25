package main

import (
	"fmt"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
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
	mux.HandleFunc("GET /api/activity", s.auth(s.handleActivityLog))
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
		if err := s.db.QueryRow(`SELECT username FROM users WHERE id = ?`, uid).Scan(&uname); err != nil {
			fail(w, 401, "user tidak ada")
			return
		}
		ctx := context.WithValue(r.Context(), ctxUser{}, uname)
		next(w, r.WithContext(ctx))
	}
}

type ctxKey struct{}
type ctxUser = ctxKey

func userName(r *http.Request) string {
	v, _ := r.Context().Value(ctxUser{}).(string)
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
	writeJSON(w, 200, map[string]string{"username": userName(r)})
}

// ---------- data endpoints ----------

func (s *apiServer) handlePtkList(w http.ResponseWriter, r *http.Request) {
	q := strings.TrimSpace(r.URL.Query().Get("q"))
	filter := r.URL.Query().Get("filter")

	base := `SELECT p.id, p.nama, p.peg_id, p.fungsi, p.kepegawaian, p.sertifikasi,
		p.kelengkapan, p.wali_kelas, p.jabatan_struktural,
		COALESCE(j.mengajar + j.tugas, NULL) AS total_jtm
	FROM ptk p LEFT JOIN jtm_semester j ON j.ptk_id = p.id`
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
	rows, err := s.db.Query(base+" WHERE "+strings.Join(where, " AND ")+" ORDER BY p.nama", args...)
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
		var kel, total sql.NullFloat64
		if err := rows.Scan(&id, &nama, &pegID, &fungsi, &kepeg, &sert, &kel, &wali, &jabatan, &total); err != nil {
			continue
		}
		out = append(out, map[string]any{
			"id": id, "nama": nama.String, "pegId": pegID.String, "fungsi": fungsi.String,
			"kepegawaian": kepeg.String, "sertifikasi": sert,
			"kelengkapan": kel.Float64, "waliKelas": wali.String,
			"jabatanStruktural": jabatan.String, "totalJtm": total.Float64,
		})
	}
	writeJSON(w, 200, out)
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
	rows3, _ := s.db.Query(`SELECT hari, jam_ke, kelas, mapel FROM roster WHERE guru_nama LIKE ? `, first + "%")
	if rows3 != nil {
		for rows3.Next() {
			var h, j, k, m sql.NullString
			rows3.Scan(&h, &j, &k, &m)
			roster = append(roster, map[string]any{"hari": h.String, "jamKe": j.String, "kelas": k.String, "mapel": m.String})
		}
		rows3.Close()
	}

	writeJSON(w, 200, map[string]any{
		"id": id, "nama": nama.String, "pegId": nullS(pegID), "nip": nullS(nip),
		"nik": nullS(nik), "nuptk": nullS(nuptk), "fungsi": fungsi.String,
		"kepegawaian": nullS(kepeg), "sertifikasi": sert, "aktivasi": akt,
		"kelengkapan": nullF(kel), "waliKelas": nullS(wali),
		"jabatanStruktural": nullS(jabatan), "catatan": nullS(catatan),
		"jtm": map[string]any{"mengajar": nullF(meng), "tugas": nullF(tugas),
			"totalS25a": nullF(s25a), "dashboardTotal": nullF(dash)},
		"skmt": skmts, "dokumen": doks, "roster": roster,
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

var hariUrut = `CASE r.hari WHEN 'SENIN' THEN 1 WHEN 'SELASA' THEN 2 WHEN 'RABU' THEN 3 WHEN 'KAMIS' THEN 4 WHEN 'JUMAT' THEN 5 WHEN 'SABTU' THEN 6 END`

func (s *apiServer) handleRoster(w http.ResponseWriter, r *http.Request) {
	kelas := r.URL.Query().Get("kelas")
	if kelas == "" {
		kelas = "IXA"
	}
	rows, err := s.db.Query(`SELECT r.hari, r.jam_ke, r.mapel, r.guru_nama FROM roster r
		WHERE r.kelas = ? ORDER BY `+hariUrut+`, LENGTH(r.jam_ke), r.jam_ke`, kelas)
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
	rows, err := s.db.Query(`SELECT s.id, p.nama, s.bulan, s.status, s.tgl_ajuan,
		(SELECT COUNT(*) FROM dokumen d WHERE d.ptk_id = s.ptk_id) AS ndok
		FROM skakpt s JOIN ptk p ON p.id = s.ptk_id
		ORDER BY CASE WHEN s.status='Menunggu Verifikasi' THEN 0 ELSE 1 END, p.nama`)
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	defer rows.Close()
	out := []map[string]any{}
	for rows.Next() {
		var id int64
		var nama, bulan, st, tgl sql.NullString
		var nd sql.NullFloat64
		rows.Scan(&id, &nama, &bulan, &st, &tgl, &nd)
		out = append(out, map[string]any{
			"ptkId": id, "nama": nama.String, "bulan": bulan.String,
			"status": st.String, "tglAjuan": tgl.String, "jmlDokumen": int(nd.Float64),
		})
	}
	writeJSON(w, 200, out)
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

func (s *apiServer) handleStats(w http.ResponseWriter, r *http.Request) {
	get := func(q string, args ...any) int64 {
		var c int64
		s.db.QueryRow(q, args...).Scan(&c)
		return c
	}
	stats := map[string]int64{
		"totalPtk":        get(`SELECT COUNT(*) FROM ptk`),
		"guru":            get(`SELECT COUNT(*) FROM ptk WHERE fungsi='Guru'`),
		"sertifikasi":     get(`SELECT COUNT(*) FROM ptk WHERE sertifikasi=1`),
		"belumSertifikasi": get(`SELECT COUNT(*) FROM ptk WHERE sertifikasi=0 AND fungsi='Guru'`),
		"jtmDiBawah24":    get(`SELECT COUNT(*) FROM jtm_semester WHERE (COALESCE(mengajar,0)+COALESCE(tugas,0)) < 24`),
		"skmtDisetujui":   get(`SELECT COUNT(DISTINCT ptk_id) FROM skmt_ajuan WHERE status LIKE 'Disetujui%'`),
		"skmtMenunggu":    get(`SELECT COUNT(*) FROM skmt_ajuan WHERE status='Menunggu'`),
		"rosterSlot":      get(`SELECT COUNT(*) FROM roster`),
		"dokumen":         get(`SELECT COUNT(*) FROM dokumen`),
		"skbkDisetujui":   get(`SELECT COUNT(DISTINCT ptk_id) FROM skbk_ajuan WHERE status='Sudah Diajukan'`),
		"skbkMenunggu":    get(`SELECT COUNT(*) FROM skbk_ajuan WHERE status='Belum Diajukan'`),
		"skakptDiajukan":  get(`SELECT COUNT(*) FROM skakpt WHERE status='Menunggu Verifikasi'`),
		"skakptMenunggu":  get(`SELECT COUNT(*) FROM skakpt WHERE status='Menunggu Verifikasi'`),
	}
	writeJSON(w, 200, stats)
}
