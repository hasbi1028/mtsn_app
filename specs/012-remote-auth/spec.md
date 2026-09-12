# spec.md — 012 Remote Auth (Login & Logout)

> Migrasi A1 dari `plan-full-remote.md`. Tujuan: hapus `+page.server.ts` actions di
> login & logout, ganti dengan remote function dari `auth.remote.ts`.

---

## Module: Auth

### User Story

As any user, I want login & logout berjalan lewat remote function (`form`/`command`)
so that app fullstack SvelteKit tanpa legacy server actions maupun Go API.

**Roles:** `admin`, `guru`, `siswa`, `orangtua` (semua role bisa login/logout)

### Acceptance Criteria

- [ ] Login memakai remote `form()` dari `auth.remote.ts` (`{...login}` + `.enhance`)
- [ ] Login gagal → toast error tampil, tetap di halaman login
- [ ] Login sukses → redirect: `siswa` → `/siswa/profil`, selain itu → `/`
- [ ] Logout memakai remote `form()` (progressive enhancement), hapus cookie `session_id` + `mtsn_session`, redirect `/login`
- [ ] `src/routes/login/+page.server.ts` & `src/routes/logout/+page.server.ts` TIDAK mengandung `export const actions`
- [ ] Tidak ada `fetch('/api/...')` di komponen auth
- [ ] `cookies.set/delete` hanya terjadi di server (remote function)

### Edge Cases

- Kredensial salah → handler `login` **return** `{ error }` (bukan `error()` throw),
  agar toast tetap tampil tanpa halaman `+error.svelte`
- Field kosong / < 3 karakter → ditolak `loginSchema` (server-side)
- Logout tanpa sesi aktif → tetap redirect `/login` (idempotent)
- Form tanpa JavaScript → tetap berfungsi (progressive enhancement via `form()`)

### Out of Scope

- `getMe()` dan middleware sesi (sudah ada di `hooks.server.ts`)
- Rate limiting / captcha login

---

## Data Model

| Table | Columns Used | Relation |
|-------|-------------|----------|
| `users` | `id`, `username`, `password_hash`, `role`, `ref_id` | — |
| `sessions` | `token`, `user_id`, `expires_at` | FK → `users.id` |

Query pattern: dilakukan di `auth.service.ts` (`validateCredentials`, `createSession`,
`deleteSessionByToken`, `getUserFromSession`, `updateLastLogin`).

---

## Domain Module

```
src/modules/auth/
├── auth.validation.ts   # loginSchema (sudah ada)
├── auth.service.ts      # DB + hash + session (sudah ada)
├── auth.remote.ts       # login (form), logoutForm (form), getMe (query)
└── components/
    └── login-form.svelte
```

### Remote Contract (`auth.remote.ts`)

```ts
// form — dipakai <form {...login.enhance(...)}>
export const login = form(loginSchema, async ({ username, password }) => {
  const user = validateCredentials(username, password);
  if (!user) return { error: 'Username atau password salah' }; // return, bukan throw
  const token = createSession(user.id);
  cookies.set('session_id', token, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 604800 });
  updateLastLogin(user.id);
  redirect(303, user.role === 'siswa' ? '/siswa/profil' : '/');
});

// form — dipakai pada <form {...logoutForm}> di header/mobile/siswa/ortu
export const logoutForm = form(v.object({}), async () => {
  const token = cookies.get('session_id');
  if (token) deleteSessionByToken(token);
  cookies.delete('session_id', { path: '/' });
  cookies.delete('mtsn_session', { path: '/' });
  redirect(303, '/login');
});

// query (sudah ada)
export const getMe = query(async () => { /* ... */ });
```

> Catatan: `logout` diubah dari `command` → `form` karena `redirect()` tidak
> diizinkan di dalam `command()` (lihat dokumentasi SvelteKit Remote Functions).

### UI

- `login-form.svelte` → `<form {...login.enhance(cb)}>`; unggah state dari `$app/forms`
  `use:enhance` lama; tampil toast via `notify.error` saat `login.result?.error`
- 4 lokasi logout: `site-header.svelte`, `+layout.svelte` (mobile siswa/ortu),
  `siswa/profil/+page.svelte`, `ortu/profil/+page.svelte` → `{...logoutForm}`

---

## E2E Test

- `tests/e2e/auth.spec.ts` — tambah: logout via UI → cookie `session_id` kosong + URL `/login`
- `tests/e2e/full-remote.spec.ts` (baru) — guard struktural:
  - `login/+page.server.ts` tidak punya `export const actions`
  - `logout/+page.server.ts` tidak punya `export const actions`
  - tidak ada `fetch('/api/` di `login-form.svelte`

---

## Migration Checklist

- [ ] Spec reviewed & approved
- [ ] E2E ditulis → RED
- [ ] `auth.remote.ts` — login return error + `logoutForm`
- [ ] `login-form.svelte` → remote form
- [ ] 4 form logout → `{...logoutForm}`
- [ ] Hapus `src/routes/login/+page.server.ts`
- [ ] Hapus `src/routes/logout/+page.server.ts`
- [ ] E2E GREEN
- [ ] Svelte autofixer dijalankan
- [ ] `npm run check` pass
