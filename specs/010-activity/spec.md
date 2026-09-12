# Spec 010: Activity Log

## User Story
Sebagai admin, saya ingin melihat log aktivitas pengguna untuk audit trail.

## Acceptance Criteria
1. **Activity list** — Menampilkan 50 aktivitas terakhir
2. **Info user** — Username pelaku aktivitas
3. **Action + detail** — Jenis aktivitas dan detailnya
4. **Timestamp** — Waktu aktivitas terjadi

## Data Model
- `activity_log` — id, user_id, action, detail, created_at
- `users` — id, username (join)

## Remote Functions
- `getActivityLog()` — Query last 50 activities
