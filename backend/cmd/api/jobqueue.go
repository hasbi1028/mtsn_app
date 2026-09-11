package main

import (
	"fmt"
	"log"
	"sync"
	"time"
)

const (
	MaxWorkers     = 3
	MaxRetries     = 3
	QueueCapacity  = 500
)

type JobStatus string

const (
	JobPending    JobStatus = "pending"
	JobProcessing JobStatus = "processing"
	JobDone       JobStatus = "done"
	JobFailed     JobStatus = "failed"
)

type BatchStatus string

const (
	BatchProcessing BatchStatus = "processing"
	BatchCompleted  BatchStatus = "completed"
)

type Job struct {
	ID        string    `json:"id"`
	SiswaID   string    `json:"siswa_id"`
	Nama      string    `json:"nama"`
	Type      string    `json:"type"` // "both"
	Status    JobStatus `json:"status"`
	Error     string    `json:"error,omitempty"`
	Retries   int       `json:"retries"`
	CreatedAt time.Time `json:"created_at"`
	StartedAt time.Time `json:"started_at,omitempty"`
	DoneAt    time.Time `json:"done_at,omitempty"`
}

type BatchJob struct {
	ID        string      `json:"id"`
	Status    BatchStatus `json:"status"`
	Total     int         `json:"total"`
	Done      int         `json:"done"`
	Failed    int         `json:"failed"`
	CreatedAt time.Time   `json:"created_at"`
	DoneAt    time.Time   `json:"done_at,omitempty"`
	mu        sync.Mutex
	jobs      map[string]*Job
}

func (b *BatchJob) markDone(jobID string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if j, ok := b.jobs[jobID]; ok && j.Status == JobProcessing {
		j.Status = JobDone
		j.DoneAt = time.Now()
		b.Done++
	}
	if b.Done+b.Failed >= b.Total {
		b.Status = BatchCompleted
		b.DoneAt = time.Now()
	}
}

func (b *BatchJob) markFailed(jobID, errMsg string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if j, ok := b.jobs[jobID]; ok {
		j.Status = JobFailed
		j.Error = errMsg
		j.DoneAt = time.Now()
		b.Failed++
	}
	if b.Done+b.Failed >= b.Total {
		b.Status = BatchCompleted
		b.DoneAt = time.Now()
	}
}

func (b *BatchJob) getProgress() (done, failed, total int, status BatchStatus) {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.Done, b.Failed, b.Total, b.Status
}

type JobQueue struct {
	pending chan *Job
	batches map[string]*BatchJob
	mu      sync.RWMutex
	stopCh  chan struct{}
}

var globalQueue *JobQueue

func NewJobQueue() *JobQueue {
	q := &JobQueue{
		pending: make(chan *Job, QueueCapacity),
		batches: make(map[string]*BatchJob),
		stopCh:  make(chan struct{}),
	}
	for i := 0; i < MaxWorkers; i++ {
		go q.worker(i)
	}
	return q
}

func (q *JobQueue) worker(id int) {
	for {
		select {
		case <-q.stopCh:
			return
		case job := <-q.pending:
			q.processJob(job)
		}
	}
}

func (q *JobQueue) processJob(job *Job) {
	job.Status = JobProcessing
	job.StartedAt = time.Now()

	sd, err := globalAPI.getSiswaKartu(job.SiswaID)
	if err != nil {
		q.handleJobFailure(job, fmt.Sprintf("siswa not found: %v", err))
		return
	}

	d := buildKartuHTMLData(sd)

	// Generate front
	if err := renderKartuToFile(job.SiswaID, d); err != nil {
		if job.Retries < MaxRetries {
			job.Retries++
			job.Status = JobPending
			log.Printf("[queue] worker: job %s front failed (retry %d/%d): %v", job.ID, job.Retries, MaxRetries, err)
			q.pending <- job
			return
		}
		q.handleJobFailure(job, fmt.Sprintf("front: %v", err))
		return
	}

	// Generate back
	if err := renderKartuBackToFile(job.SiswaID, d); err != nil {
		if job.Retries < MaxRetries {
			job.Retries++
			job.Status = JobPending
			log.Printf("[queue] worker: job %s back failed (retry %d/%d): %v", job.ID, job.Retries, MaxRetries, err)
			q.pending <- job
			return
		}
		q.handleJobFailure(job, fmt.Sprintf("back: %v", err))
		return
	}

	// Find batch and mark done
	q.mu.RLock()
	for _, batch := range q.batches {
		batch.mu.Lock()
		if _, ok := batch.jobs[job.ID]; ok {
			batch.mu.Unlock()
			q.mu.RUnlock()
			batch.markDone(job.ID)
			log.Printf("[queue] worker: job %s done (siswa %s)", job.ID, job.Nama)
			return
		}
		batch.mu.Unlock()
	}
	q.mu.RUnlock()
}

func (q *JobQueue) handleJobFailure(job *Job, errMsg string) {
	job.Status = JobFailed
	job.Error = errMsg
	job.DoneAt = time.Now()

	q.mu.RLock()
	for _, batch := range q.batches {
		batch.mu.Lock()
		if _, ok := batch.jobs[job.ID]; ok {
			batch.mu.Unlock()
			q.mu.RUnlock()
			batch.markFailed(job.ID, errMsg)
			log.Printf("[queue] worker: job %s failed: %s", job.ID, errMsg)
			return
		}
		batch.mu.Unlock()
	}
	q.mu.RUnlock()
}

func (q *JobQueue) EnqueueBatch(siswaList []SiswaListItem) *BatchJob {
	batch := &BatchJob{
		ID:        fmt.Sprintf("batch-%d", time.Now().UnixNano()),
		Status:    BatchProcessing,
		Total:     len(siswaList),
		jobs:      make(map[string]*Job),
		CreatedAt: time.Now(),
	}

	q.mu.Lock()
	q.batches[batch.ID] = batch
	q.mu.Unlock()

	for _, s := range siswaList {
		job := &Job{
			ID:        fmt.Sprintf("job-%d-%s", time.Now().UnixNano(), s.ID),
			SiswaID:   fmt.Sprintf("%d", s.ID),
			Nama:      s.Nama,
			Type:      "both",
			Status:    JobPending,
			CreatedAt: time.Now(),
		}
		batch.mu.Lock()
		batch.jobs[job.ID] = job
		batch.mu.Unlock()

		q.pending <- job
	}

	return batch
}

func (q *JobQueue) EnqueueSingle(siswaID, nama string) *Job {
	job := &Job{
		ID:        fmt.Sprintf("job-%d-%s", time.Now().UnixNano(), siswaID),
		SiswaID:   siswaID,
		Nama:      nama,
		Type:      "both",
		Status:    JobPending,
		CreatedAt: time.Now(),
	}

	// Single job gets its own mini-batch for tracking
	batch := &BatchJob{
		ID:        job.ID,
		Status:    BatchProcessing,
		Total:     1,
		jobs:      map[string]*Job{job.ID: job},
		CreatedAt: time.Now(),
	}
	q.mu.Lock()
	q.batches[batch.ID] = batch
	q.mu.Unlock()

	q.pending <- job
	return job
}

func (q *JobQueue) GetBatch(batchID string) *BatchJob {
	q.mu.RLock()
	defer q.mu.RUnlock()
	return q.batches[batchID]
}

func (q *JobQueue) CancelBatch(batchID string) int {
	q.mu.RLock()
	batch, ok := q.batches[batchID]
	q.mu.RUnlock()
	if !ok {
		return 0
	}

	cancelled := 0
	batch.mu.Lock()
	defer batch.mu.Unlock()

	for _, job := range batch.jobs {
		if job.Status == JobPending {
			job.Status = JobFailed
			job.Error = "cancelled"
			job.DoneAt = time.Now()
			batch.Failed++
			cancelled++
		}
	}

	if batch.Done+batch.Failed >= batch.Total {
		batch.Status = BatchCompleted
		batch.DoneAt = time.Now()
	}

	return cancelled
}

type SiswaListItem struct {
	ID   int
	Nama string
}
