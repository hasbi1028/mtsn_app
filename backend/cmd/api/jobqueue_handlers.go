package main

import (
	"database/sql"
	"net/http"
	"strconv"
)

func (s *apiServer) handleQueueGenerateAll(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.Query(`SELECT id, nama FROM siswa
		WHERE foto_path IS NOT NULL AND foto_path != ''
		  AND (status_emis IS NULL OR status_emis LIKE 'Aktif%')
		ORDER BY CAST(kelas AS INTEGER), rombel, nama`)
	if err != nil {
		fail(w, 500, err.Error())
		return
	}
	defer rows.Close()

	var list []SiswaListItem
	for rows.Next() {
		var id int
		var nama sql.NullString
		if rows.Scan(&id, &nama) == nil {
			list = append(list, SiswaListItem{ID: id, Nama: nama.String})
		}
	}

	if len(list) == 0 {
		fail(w, 400, "tidak ada siswa dengan foto")
		return
	}

	batch := globalQueue.EnqueueBatch(list)
	writeJSON(w, 200, map[string]any{
		"batch_id": batch.ID,
		"total":    batch.Total,
		"message":  "generate sedang diproses",
	})
}

func (s *apiServer) handleQueueStatus(w http.ResponseWriter, r *http.Request) {
	batchID := r.PathValue("batch_id")
	if batchID == "" {
		fail(w, 400, "batch_id wajib")
		return
	}

	batch := globalQueue.GetBatch(batchID)
	if batch == nil {
		fail(w, 404, "batch tidak ditemukan")
		return
	}

	batch.mu.Lock()
	done, failed, total, status := batch.Done, batch.Failed, batch.Total, batch.Status
	createdAt, doneAt := batch.CreatedAt, batch.DoneAt
	batch.mu.Unlock()

	writeJSON(w, 200, map[string]any{
		"batch_id":   batch.ID,
		"status":     status,
		"total":      total,
		"done":       done,
		"failed":     failed,
		"created_at": createdAt,
		"done_at":    doneAt,
	})
}

func (s *apiServer) handleQueueCancel(w http.ResponseWriter, r *http.Request) {
	batchID := r.PathValue("batch_id")
	if batchID == "" {
		fail(w, 400, "batch_id wajib")
		return
	}

	batch := globalQueue.GetBatch(batchID)
	if batch == nil {
		fail(w, 404, "batch tidak ditemukan")
		return
	}

	cancelled := globalQueue.CancelBatch(batchID)
	writeJSON(w, 200, map[string]any{
		"ok":        true,
		"cancelled": cancelled,
		"message":   strconv.Itoa(cancelled) + " job dibatalkan",
	})
}

func (s *apiServer) handleQueueSingleRegenerate(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		fail(w, 400, "id wajib")
		return
	}

	sd, err := s.getSiswaKartu(id)
	if err != nil {
		if err == sql.ErrNoRows {
			fail(w, 404, "siswa tidak ditemukan")
		} else {
			fail(w, 500, err.Error())
		}
		return
	}

	job := globalQueue.EnqueueSingle(sd.ID, sd.Nama)
	writeJSON(w, 200, map[string]any{
		"ok":      true,
		"job_id":  job.ID,
		"batch_id": job.ID,
		"message": "regenerate sedang diproses",
	})
}
