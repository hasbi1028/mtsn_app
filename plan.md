# plan.md — Migrasi SIMAD ke Fullstack SvelteKit Remote Functions

## Target Architecture

```
Browser → SvelteKit (3720) → Drizzle ORM → SQLite (local.db)
```

- Go API dihapus
- Semua logic di `+page.server.ts` / `data.remote.ts`
- Remote functions: `query`, `form`, `command`
- Co-located: `data.remote.ts` di sebelah `+page.svelte`

## Migration Strategy

### Prinsip
1. **Spec First** — buat spec dulu, baru code
2. **TDD** — write test → FAIL → write code → PASS
3. **MDD** — markdown drives AI context
4. **Incremental** — satu module per phase, Go API jalan paralel sampai selesai
5. **No breaking changes** — user tidak boleh merasakan migrasi

### Go API Paralel
- Selama migrasi, Go API tetap jalan di port 3730
- SvelteKit remote functions di `$lib/server/db` query langsung ke SQLite
- Setelah semua module selesai, Go API dihapus

---

## Phase 0: Database Foundation

**Goal:** Semua 20 tabel ada di Drizzle schema

**Tasks:**
- [ ] Expand `src/lib/server/db/schema.ts` — tambah tabel yang belum ada
- [ ] Pastikan tabel: `users`, `sessions`, `ptk`, `jtm_semester`, `skmt_ajuan`, `skbk_ajuan`, `skakpt`, `dokumen`, `roster`, `siswa`, `rombel`, `perubahan_siswa`, `activity_log`, `ortu`, `siswa_ortu`, `jam_bel`, `bel_settings`, `cuti`, `schema_migrations`, `kartu_cache`
- [ ] Setup `drizzle.config.ts` untuk migrations
- [ ] Test: `npx drizzle-kit generate` berhasil

**Files:**
- `src/lib/server/db/schema.ts` (expand)
- `drizzle.config.ts` (new)

---

## Phase 1: Auth (Login/Logout/Session)

**Goal:** Login, logout, session check via remote functions

**Spec:** `specs/001-auth/spec.md`

**Endpoints to migrate:**
| Go | Remote Function |
|----|----------------|
| `POST /api/login` | `login()` form |
| `POST /api/logout` | `logout()` command |
| `GET /api/me` | `getMe()` query |

**Tasks:**
- [ ] Create `src/lib/server/auth.ts` — `getUser()`, `createSession()`, `deleteSession()`
- [ ] Create `src/routes/login/data.remote.ts` — `login()`, `logout()`
- [ ] Update `src/hooks.server.ts` — use `getMe()` remote query
- [ ] Update `src/routes/+layout.server.ts` — use remote query
- [ ] Write e2e test: `tests/e2e/auth.spec.ts`
- [ ] Remove old `src/routes/login/+page.server.ts` fetch logic
- [ ] Remove `src/routes/api/login/` and `src/routes/api/logout/` proxy endpoints

**Files:**
- `src/lib/server/auth.ts` (new)
- `src/routes/login/data.remote.ts` (new)
- `src/hooks.server.ts` (update)
- `src/routes/+layout.server.ts` (update)
- `tests/e2e/auth.spec.ts` (new)
- DELETE: `src/routes/login/+page.server.ts`, `src/routes/api/login/`, `src/routes/api/logout/`

---

## Phase 2: Dashboard Stats

**Goal:** Stats dashboard via remote queries

**Spec:** `specs/002-dashboard/spec.md`

**Endpoints to migrate:**
| Go | Remote Function |
|----|----------------|
| `GET /api/stats` | `getStats()` query |
| `GET /api/bansos/stats` | `getBansosStats()` query |
| `GET /api/rombel/stats` | `getRombelStats()` query |

**Tasks:**
- [ ] Create `src/routes/+page.server.ts` — direct DB queries (stats are read-only)
- [ ] Write e2e test: `tests/e2e/dashboard.spec.ts`
- [ ] Remove fetch calls to Go API

**Files:**
- `src/routes/+page.server.ts` (update — remove fetch, direct DB)

---

## Phase 3: PTK (Pendidik & Tenaga Kependidikan)

**Goal:** List + detail PTK via remote functions

**Spec:** `specs/003-ptk/spec.md`

**Endpoints to migrate:**
| Go | Remote Function |
|----|----------------|
| `GET /api/ptk` | `getPtkList()` query |
| `GET /api/ptk/:id` | `getPtkDetail()` query |

**Tasks:**
- [ ] Create `src/routes/ptk/data.remote.ts`
- [ ] Create `src/routes/ptk/[id]/data.remote.ts`
- [ ] Update `src/routes/ptk/+page.svelte` — use remote query
- [ ] Update `src/routes/ptk/[id]/+page.svelte` — use remote query
- [ ] Write e2e test: `tests/e2e/ptk.spec.ts`

**Files:**
- `src/routes/ptk/data.remote.ts` (new)
- `src/routes/ptk/[id]/data.remote.ts` (new)
- DELETE: `src/routes/ptk/+page.server.ts`, `src/routes/ptk/[id]/+page.server.ts`

---

## Phase 4: Siswa (Students)

**Goal:** List + detail + foto upload via remote functions

**Spec:** `specs/004-siswa/spec.md`

**Endpoints to migrate:**
| Go | Remote Function |
|----|----------------|
| `GET /api/siswa` | `getSiswaList()` query |
| `GET /api/siswa/:id` | `getSiswaDetail()` query |
| `POST /api/siswa/:id/foto` | `uploadFoto()` form |
| `GET /api/siswa/me` | `getMyProfile()` query |
| `POST /api/siswa/me/foto` | `uploadMyFoto()` form |
| `POST /api/siswa/me/perubahan` | `submitPerubahan()` form |

**Tasks:**
- [ ] Create `src/routes/siswa/data.remote.ts`
- [ ] Create `src/routes/siswa/[id]/ profil/data.remote.ts`
- [ ] Create `src/routes/siswa/[id]/bansos/data.remote.ts`
- [ ] Create `src/routes/siswa/[id]/kartu/data.remote.ts`
- [ ] Create `src/routes/siswa/profil/data.remote.ts` (self-service)
- [ ] Create `src/routes/siswa/bansos/data.remote.ts` (self-service)
- [ ] Write e2e test: `tests/e2e/siswa.spec.ts`
- [ ] Remove all `+page.server.ts` with fetch calls

**Files:**
- `src/routes/siswa/data.remote.ts` (new)
- `src/routes/siswa/[id]/profil/data.remote.ts` (new)
- `src/routes/siswa/[id]/bansos/data.remote.ts` (new)
- `src/routes/siswa/[id]/kartu/data.remote.ts` (new)
- `src/routes/siswa/profil/data.remote.ts` (new)
- `src/routes/siswa/bansos/data.remote.ts` (new)

---

## Phase 5: Rombel (Class Groups)

**Goal:** CRUD rombel + allocate siswa via remote functions

**Spec:** `specs/005-rombel/spec.md`

**Endpoints to migrate:**
| Go | Remote Function |
|----|----------------|
| `GET /api/rombel` | `getRombelList()` query |
| `GET /api/rombel/stats` | `getRombelStats()` query |
| `GET /api/rombel/:id` | `getRombelDetail()` query |
| `POST /api/rombel` | `createRombel()` form |
| `PUT /api/rombel/:id` | `updateRombel()` command |
| `DELETE /api/rombel/:id` | `deleteRombel()` command |
| `POST /api/rombel/:id/siswa` | `allocateSiswa()` command |
| `DELETE /api/rombel/:id/siswa/:sid` | `removeSiswa()` command |
| `POST /api/rombel/:id/wali` | `setWaliKelas()` command |

**Tasks:**
- [ ] Create `src/routes/rombel/data.remote.ts`
- [ ] Create `src/routes/rombel/[id]/data.remote.ts`
- [ ] Write e2e test: `tests/e2e/rombel.spec.ts`

**Files:**
- `src/routes/rombel/data.remote.ts` (new)
- `src/routes/rombel/[id]/data.remote.ts` (new)

---

## Phase 6: Dokumen (SKMT + SKBK + SKAKPT)

**Goal:** List dokumen via remote queries

**Spec:** `specs/007-dokumen/spec.md`

**Endpoints to migrate:**
| Go | Remote Function |
|----|----------------|
| `GET /api/skmt` | `getSkmtList()` query |
| `GET /api/skbk` | `getSkbkList()` query |
| `GET /api/skakpt` | `getSkakptList()` query |
| `GET /api/skakpt/months` | `getSkakptMonths()` query |
| `GET /api/skakpt/bukti/:name` | Keep as `+server.ts` proxy |

**Tasks:**
- [ ] Create `src/routes/skmt/data.remote.ts`
- [ ] Create `src/routes/skbk/data.remote.ts`
- [ ] Create `src/routes/skakpt/data.remote.ts`
- [ ] Keep `src/routes/api/skakpt/bukti/[name]/+server.ts` (image proxy)
- [ ] Write e2e test: `tests/e2e/dokumen.spec.ts`

**Files:**
- `src/routes/skmt/data.remote.ts` (new)
- `src/routes/skbk/data.remote.ts` (new)
- `src/routes/skakpt/data.remote.ts` (new)

---

## Phase 7: Kartu (Student ID Card)

**Goal:** Generate kartu + batch queue via remote functions

**Spec:** `specs/008-kartu/spec.md`

**Endpoints to migrate:**
| Go | Remote Function |
|----|----------------|
| `GET /api/siswa/kartu/list` | `getKartuList()` query |
| `POST /api/siswa/kartu/generate-all` | `generateAllKartu()` command |
| `GET /api/siswa/:id/kartu.png` | Keep as `+server.ts` (static file) |
| `GET /api/siswa/:id/kartu-back.png` | Keep as `+server.ts` (static file) |
| `POST /api/siswa/:id/kartu/regenerate` | `regenerateKartu()` command |
| `GET /api/kartu/queue/:id` | `getQueueStatus()` query |
| `POST /api/kartu/queue/:id/cancel` | `cancelQueue()` command |

**Tasks:**
- [ ] Move `backend/cmd/api/kartu_png.go` → `src/lib/server/kartu/render.ts`
- [ ] Move `backend/cmd/api/jobqueue.go` → `src/lib/server/kartu/queue.ts`
- [ ] Create `src/routes/siswa/kartu/data.remote.ts`
- [ ] Create `src/routes/siswa/[id]/kartu/data.remote.ts`
- [ ] Keep `+server.ts` for PNG file serving (not remote function)
- [ ] Write e2e test: `tests/e2e/kartu.spec.ts`

**Files:**
- `src/lib/server/kartu/render.ts` (new — port Go to TS)
- `src/lib/server/kartu/queue.ts` (new — port Go to TS)
- `src/routes/siswa/kartu/data.remote.ts` (new)
- `src/routes/siswa/[id]/kartu/data.remote.ts` (new)

---

## Phase 8: Bel (School Bell)

**Goal:** Bell control + CRUD jadwal + suara via remote functions

**Spec:** `specs/009-bel/spec.md`

**Endpoints to migrate:**
| Go | Remote Function |
|----|----------------|
| `GET /api/bel/status` | `getBelStatus()` query |
| `POST /api/bel/play` | `playBell()` command |
| `POST /api/bel/stop` | `stopBell()` command |
| `GET /api/bel/jadwal` | `getJadwalList()` query |
| `POST /api/bel/jadwal` | `createJadwal()` form |
| `PUT /api/bel/jadwal/:id` | `updateJadwal()` command |
| `DELETE /api/bel/jadwal/:id` | `deleteJadwal()` command |
| `POST /api/bel/master` | `toggleMaster()` command |
| `GET /api/bel/suara` | `getSuaraList()` query |
| `POST /api/bel/suara` | `uploadSuara()` form |
| `DELETE /api/bel/suara/:name` | `deleteSuara()` command |

**Note:** Worker-bel (port 8093) tetap berjalan sebagai独立 process. Remote functions proxy ke worker.

**Tasks:**
- [ ] Create `src/lib/server/bel.ts` — proxy functions ke worker-bel
- [ ] Create `src/routes/bel/data.remote.ts`
- [ ] Create `src/routes/bel/suara/data.remote.ts`
- [ ] Write e2e test: `tests/e2e/bel.spec.ts`

**Files:**
- `src/lib/server/bel.ts` (new — worker proxy)
- `src/routes/bel/data.remote.ts` (new)
- `src/routes/bel/suara/data.remote.ts` (new)

---

## Phase 9: Approval

**Goal:** Approve/reject foto + perubahan via remote functions

**Spec:** `specs/010-approval/spec.md`

**Endpoints to migrate:**
| Go | Remote Function |
|----|----------------|
| `GET /api/approval/foto` | `getApprovalFoto()` query |
| `POST /api/approval/foto/:id/approve` | `approveFoto()` command |
| `POST /api/approval/foto/:id/reject` | `rejectFoto()` command |
| `GET /api/approval/perubahan` | `getApprovalPerubahan()` query |
| `POST /api/approval/perubahan/:id/approve` | `approvePerubahan()` command |
| `POST /api/approval/perubahan/:id/reject` | `rejectPerubahan()` command |

**Tasks:**
- [ ] Create `src/routes/approval/data.remote.ts`
- [ ] Write e2e test: `tests/e2e/approval.spec.ts`

**Files:**
- `src/routes/approval/data.remote.ts` (new)

---

## Phase 10: Bansos + Activity

**Goal:** Stats + activity log via remote queries

**Spec:** `specs/011-bansos/spec.md`, `specs/012-activity/spec.md`

**Endpoints to migrate:**
| Go | Remote Function |
|----|----------------|
| `GET /api/bansos/stats` | (done in Phase 2) |
| `GET /api/activity` | `getActivityLog()` query |

**Tasks:**
- [ ] Create `src/routes/activity/data.remote.ts`
- [ ] Write e2e test: `tests/e2e/activity.spec.ts`

**Files:**
- `src/routes/activity/data.remote.ts` (new)

---

## Phase 11: Cleanup

**Goal:** Hapus Go API, update PM2

**Tasks:**
- [ ] Verify semua module berjalan tanpa Go API
- [ ] Update `ecosystem.config.cjs` — hapus `mtsn-app-api`
- [ ] `rm -rf backend/`
- [ ] Update `.gitignore` — hapus backend references
- [ ] Update README.md — hapus Go API mention
- [ ] Commit: `refactor: delete Go API — fully migrated to SvelteKit`

---

## Execution Order

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
    → Phase 6 → Phase 7 → Phase 8 → Phase 9 → Phase 10 → Phase 11
```

Setiap phase:
1. Buat spec di `specs/NNN-name/spec.md`
2. Buat test di `tests/e2e/[module].spec.ts`
3. Run test → FAIL
4. Buat remote function + page
5. Run test → PASS
6. Commit
7. Next phase

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Remote functions experimental | Pin SvelteKit version, test thoroughly |
| Playwright render (kartu) | Keep as `+server.ts`, not remote function |
| Worker-bel (Go) | Tetap独立, SvelteKit proxy via `src/lib/server/bel.ts` |
| SQLite concurrency | Drizzle handles this, no change needed |
| Breaking changes mid-migration | Go API tetap jalan sampai Phase 11 |

---

## Success Criteria

- [ ] Semua 55 Go endpoints migrated
- [ ] Semua e2e tests pass
- [ ] Go API deleted
- [ ] PM2 hanya menjalankan 1 service (mtsn-app-bff)
- [ ] Spec untuk semua 12 modules selesai
