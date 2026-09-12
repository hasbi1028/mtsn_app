# test-plan.md — SIMAD Test Strategy

> Semua module harus punya test sebelum release.

---

## Test Strategy

| Level | Tool | Coverage |
|-------|------|----------|
| E2E | Playwright | User flows (happy path + error + role guard) |
| Unit | Vitest | Service layer (DB queries, validation, business logic) |
| Structural | Playwright | Guard rails (no legacy code, no Go API) |

---

## E2E Scenarios per Module

### 1. Auth
```gherkin
Scenario: Login sukses
  Given user di halaman /login
  When user isi username "hasbi" dan password "admin123"
  And user klik "Masuk"
  Then redirect ke /
  And Dashboard visible

Scenario: Login gagal
  Given user di halaman /login
  When user isi password salah
  Then toast error muncul
  Tetap di /login

Scenario: Akses tanpa login
  Given user tidak login
  When user buka /
  Then redirect ke /login

Scenario: Logout
  Given user sudah login
  When user klik "Keluar"
  Then session_id cookie dihapus
  And redirect ke /login
```

### 2. Dashboard
```gherkin
Scenario: Stats tampil
  Given admin sudah login
  When buka /
  Then total PTK visible
  And total Siswa visible
  And sidebar navigation visible
```

### 3. PTK
```gherkin
Scenario: List PTK
  Given admin sudah login
  When buka /ptk
  Then tabel PTK atau empty state visible

Scenario: Search PTK
  Given admin di /ptk
  When ketik "guru" di search
  Then hasil filter tampil

Scenario: Detail PTK
  Given admin di /ptk
  When klik nama PTK
  Then halaman detail PTK tampil
  And data JTM, SKMT, SKBK visible
```

### 4. Siswa
```gherkin
Scenario: List siswa
  Given admin sudah login
  When buka /siswa
  Then tabel siswa atau empty state visible

Scenario: Profil siswa (admin)
  Given admin di /siswa
  When klik nama siswa
  Then profil siswa tampil
  And tombol "Ubah" foto visible

Scenario: Siswa login → profil sendiri
  Given siswa login
  When buka /siswa/profil
  Then profil sendiri tampil
  And bisa ajukan perubahan data
  And bisa upload foto
```

### 5. Rombel
```gherkin
Scenario: List rombel
  Given admin sudah login
  When buka /rombel
  Then daftar rombel tampil
```

### 6. Dokumen (SKMT/SKBK/SKAKPT)
```gherkin
Scenario: SKMT list
  Given admin sudah login
  When buka /skmt
  Then daftar SKMT tampil

Scenario: SKBK list
  Given admin sudah login
  When buka /skbk
  Then daftar SKBK tampil

Scenario: SKAKPT list
  Given admin sudah login
  When buka /skakpt
  Then daftar SKAKPT tampil
```

### 7. Kartu
```gherkin
Scenario: Batch kartu
  Given admin sudah login
  When buka /siswa/kartu
  Then grid kartu tampil
  And setiap kartu punya depan + belakang

Scenario: Single kartu
  Given admin di /siswa/kartu
  When klik kartu siswa
  Then preview kartu tampil
  And tombol generate ulang, cetak, download ada
```

### 8. Bel
```gherkin
Scenario: Bel page
  Given admin sudah login
  When buka /bel
  Then jadwal bel tampil
  And status worker visible
```

### 9. Approval
```gherkin
Scenario: Approval page
  Given admin sudah login
  When buka /approval
  Then daftar pending approval tampil
```

### 10. Activity
```gherkin
Scenario: Activity log
  Given admin sudah login
  When buka /activity
  Then log aktivitas tampil
  And entries sorted by waktu
```

### 11. Roster
```gherkin
Scenario: Roster page
  Given admin sudah login
  When buka /roster
  Then jadwal mengajar tampil
  And kelas selector visible
```

### 12. Ortu
```gherkin
Scenario: Ortu login
  Given ortu login
  When buka /ortu
  Then profil anak tampil
```

---

## Role-Based Access Control

| Page | admin | guru | siswa | ortu |
|------|-------|------|-------|------|
| `/` (dashboard) | ✅ | ✅ | ❌ | ❌ |
| `/ptk` | ✅ | ✅ | ❌ | ❌ |
| `/siswa` | ✅ | ❌ | ❌ | ❌ |
| `/siswa/profil` | ❌ | ❌ | ✅ | ❌ |
| `/rombel` | ✅ | ✅ | ❌ | ❌ |
| `/roster` | ✅ | ✅ | ❌ | ❌ |
| `/skmt`, `/skbk`, `/skakpt` | ✅ | ❌ | ❌ | ❌ |
| `/bel` | ✅ | ❌ | ❌ | ❌ |
| `/approval` | ✅ | ❌ | ❌ | ❌ |
| `/activity` | ✅ | ❌ | ❌ | ❌ |
| `/ortu` | ❌ | ❌ | ❌ | ✅ |

---

## Unit Test Scenarios

### auth.service.ts
- `hashPassword` returns salt:hash format
- `validateCredentials` returns user for valid credentials
- `validateCredentials` returns null for invalid credentials
- `createSession` returns token and stores in DB
- `getUserFromSession` returns user for valid token
- `getUserFromSession` returns null for expired token

### siswa.service.ts
- `getSiswaList` returns paginated results
- `getSiswaList` filters by search query
- `getSiswaDetail` returns siswa for valid ID
- `getSiswaDetail` returns null for invalid ID
- `getSiswaBansos` includes bansos interpretation
- `submitPerubahan` creates pending request
- `submitPerubahan` rejects duplicate pending

### ptk.service.ts
- `getPtkList` returns paginated results
- `getPtkList` filters by search query
- `getPtkList` filters by sertifikasi
- `getPtkDetail` includes JTM, SKMT, SKBK, SKAKPT, dokumen, roster

### dashboard.service.ts
- `getGeneralStats` returns all stat counts
- `getRombelStats` returns allocation data
- `getBansosStats` returns bansos distribution

### bel.service.ts
- `getBelJadwal` returns jadwal grouped by day
- `createBelJadwal` inserts new schedule
- `updateBelJadwal` updates existing schedule
- `deleteBelJadwal` removes schedule

### rombel.service.ts
- `getRombelList` returns all rombel
- `createRombel` inserts new rombel
- `updateRombel` updates existing rombel
- `deleteRombel` removes rombel

---

## Structural Guards (full-remote.spec.ts)

- [ ] Tidak ada `fetch('/api/...')` di seluruh `src/`
- [ ] Tidak ada `+page.server.ts` dengan `export const actions`
- [ ] Tidak ada import `enhance` dari `$app/forms`
- [ ] `backend/` dan exe Go tidak ada
- [ ] `ecosystem.config.cjs` bersih dari Go API service
- [ ] Endpoint bisnis legacy semua 404
- [ ] Endpoint biner/statis yang diizinkan tetap ada

---

## Coverage Targets

| Metric | Target |
|--------|--------|
| E2E happy paths | 100% |
| E2E error paths | 80% |
| E2E role guards | 100% |
| Unit tests | 70% |
| Structural guards | 100% |

---

## Running Tests

```bash
# E2E tests
npx playwright test tests/e2e/[module].spec.ts

# Unit tests
npx vitest run src/lib/server/**/*.test.ts

# All tests
npm run test && npx playwright test

# Structural guards only
npx playwright test tests/e2e/full-remote.spec.ts
```
