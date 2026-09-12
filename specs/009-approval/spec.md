# Spec 009: Approval (Foto & Perubahan Data)

## User Story
Sebagai admin, saya ingin menyetujui atau menolak foto siswa dan perubahan data siswa yang diajukan oleh siswa.

## Acceptance Criteria
1. **Foto pending list** — Menampilkan semua siswa dengan foto pending
2. **Approve foto** — Memindahkan foto pending ke foto aktif
3. **Reject foto** — Menghapus foto pending
4. **Perubahan pending list** — Menampilkan semua perubahan data yang menunggu approval
5. **Approve perubahan** — Menerapkan perubahan ke data siswa
6. **Reject perubahan** — Menolak perubahan dengan catatan

## Data Model
- `siswa` — foto_pending, foto_path, foto_status
- `perubahan_siswa` — siswa_id, field, nilai_lama, nilai_baru, status, catatan

## Remote Functions
- `getApprovalFotoList()` — Query pending photos
- `approveFoto(id)` — Command: approve photo
- `rejectFoto(id)` — Command: reject photo
- `getApprovalPerubahanList()` — Query pending changes
- `approvePerubahan(id)` — Command: approve & apply change
- `rejectPerubahan(id, catatan)` — Command: reject with note
