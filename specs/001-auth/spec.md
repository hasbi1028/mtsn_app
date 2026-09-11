# spec.md — Auth Module

## Module: Auth

### User Story

As a user, I want to login/logout so that my session is secure.

**Roles:**
- `admin` — Full access to all modules
- `guru` — Access to PTK, rombel, roster
- `siswa` — Self-service profil
- `orangtua` — View child data

### Acceptance Criteria

- [ ] User can login with username + password
- [ ] Session token stored as httpOnly cookie
- [ ] Redirect to `/login` if unauthenticated
- [ ] User can logout (session deleted)
- [ ] Role-based redirect after login (admin→/ptk, siswa→/siswa/profil)

### Edge Cases

- [ ] Invalid credentials → show error toast
- [ ] Expired session → redirect to login

### Out of Scope

- Registration (admin creates accounts)
- Password reset
- OAuth/SSO

---

## Data Model

### Tables

| Table | Columns Used |
|-------|-------------|
| `users` | `id`, `username`, `password_hash`, `role`, `ref_id`, `is_active` |
| `sessions` | `token`, `user_id`, `expires_at` |

---

## Domain Module Structure

```
src/modules/auth/
├── auth.validation.ts    # loginSchema, UserSession
├── auth.service.ts       # hashPassword, createSession, getUserFromSession
├── auth.remote.ts        # login(), logout(), getMe()
└── components/
    └── login-form.svelte # Login UI
```

### auth.validation.ts

```ts
import * as v from 'valibot';

export const loginSchema = v.object({
  username: v.pipe(v.string(), v.nonEmpty(), v.minLength(3)),
  password: v.pipe(v.string(), v.nonEmpty(), v.minLength(3))
});

export interface UserSession {
  userId: number;
  username: string;
  role: string;
  refId: number | null;
}
```

### auth.service.ts

```ts
export function validateCredentials(username: string, password: string) { ... }
export function createSession(userId: number): string { ... }
export function deleteSessionByToken(token: string) { ... }
export function getUserFromSession(token: string): UserSession | null { ... }
export function updateLastLogin(userId: number) { ... }
```

### auth.remote.ts

```ts
export const login = form(loginSchema, async ({ username, password }) => { ... });
export const logout = command(async () => { ... });
export const getMe = query(async () => { ... });
```

### components/login-form.svelte

```svelte
<form {...login.enhance(async (form) => { ... })}>
  <input {...login.fields.username.as('text')} />
  <input {...login.fields._password.as('password')} />
  <button>Masuk</button>
</form>
```

---

## E2E Test

```ts
tests/e2e/auth.spec.ts
- can login with valid credentials
- shows error with invalid credentials
- redirects to login when unauthenticated
```

---

## Migration Checklist

- [ ] Validation schema created
- [ ] Service layer created
- [ ] Remote wrapper created
- [ ] Login form moved to module
- [ ] hooks.server.ts updated (uses auth.service)
- [ ] Old files deleted
- [ ] E2E test passing
- [ ] Svelte autofixer run
- [ ] `npm run check` passes
