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
- [ ] Rate limiting: 5 failed attempts per minute

### Edge Cases

- [ ] Invalid credentials → show error toast
- [ ] Expired session → redirect to login
- [ ] Multiple tabs → same session

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

### Query Pattern

```sql
-- Login: find user by username
SELECT * FROM users WHERE username = ? AND is_active = 1;

-- Create session
INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?);

-- Validate session
SELECT u.username, u.role, u.ref_id
FROM sessions s JOIN users u ON s.user_id = u.id
WHERE s.token = ? AND s.expires_at > ?;

-- Logout
DELETE FROM sessions WHERE token = ?;
```

---

## Remote Functions

### src/routes/login/data.remote.ts

```ts
import * as v from 'valibot';
import { form, command, query } from '$app/server';
import { error, redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { users, sessions } from '$lib/server/db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

function createToken(): string {
  return randomBytes(32).toString('hex');
}

export const login = form(
  v.object({
    username: v.pipe(v.string(), v.nonEmpty()),
    password: v.pipe(v.string(), v.nonEmpty())
  }),
  async ({ username, password }) => {
    const { cookies } = getRequestEvent();

    // Find user
    const user = db.select().from(users).where(
      and(eq(users.username, username), eq(users.isActive, 1))
    ).get();

    if (!user || user.passwordHash !== hashPassword(password)) {
      error(401, 'Username atau password salah');
    }

    // Create session
    const token = createToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    db.insert(sessions).values({
      token,
      userId: user.id,
      expiresAt
    }).run();

    // Set cookie
    cookies.set('session_id', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60
    });

    // Update last login
    db.update(users).set({ lastLogin: new Date().toISOString() }).where(eq(users.id, user.id)).run();

    // Role-based redirect
    const redirectTo = user.role === 'siswa' ? '/siswa/profil' : '/';
    redirect(303, redirectTo);
  }
);

export const logout = command(async () => {
  const { cookies } = getRequestEvent();
  const token = cookies.get('session_id');

  if (token) {
    db.delete(sessions).where(eq(sessions.token, token)).run();
    cookies.delete('session_id', { path: '/' });
  }

  redirect(303, '/login');
});

export const getMe = query(async () => {
  const { cookies } = getRequestEvent();
  const token = cookies.get('session_id');

  if (!token) return null;

  const session = db.select({
    username: users.username,
    role: users.role,
    refId: users.refId
  }).from(sessions).innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, Date.now())))
    .get();

  return session ?? null;
});
```

---

## UI Components

### src/routes/login/+page.svelte

```svelte
<script>
  import { login } from './data.remote';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';

  let username = $state('');
  let password = $state('');
</script>

<Card class="w-[400px]">
  <CardHeader>
    <CardTitle>Login SIMAD</CardTitle>
  </CardHeader>
  <CardContent>
    <form {...login.enhance(async (form) => {
      if (!await form.submit()) {
        // error handled by validation
      }
    })}>
      <div class="space-y-4">
        <Input {...login.fields.username.as('text')} placeholder="Username" />
        <Input {...login.fields._password.as('password')} placeholder="Password" />
        <Button type="submit" class="w-full">Login</Button>
      </div>
    </form>
  </CardContent>
</Card>
```

---

## E2E Test

```ts
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Auth', () => {
  test('can login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'hasbi');
    await page.fill('input[name="_password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('shows error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'wrong');
    await page.fill('input[name="_password"]', 'wrong');
    await page.click('button[type="submit"]');
    await expect(page.locator('.toast')).toContainText('salah');
  });

  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/ptk');
    await expect(page).toHaveURL('/login');
  });
});
```

---

## Migration Checklist

- [ ] Schema: `users` + `sessions` tables in Drizzle
- [ ] Remote functions: `login()`, `logout()`, `getMe()`
- [ ] `src/hooks.server.ts` — use `getMe()` query
- [ ] `src/routes/+layout.server.ts` — use remote query
- [ ] Delete old proxy endpoints (`src/routes/api/login/`, `src/routes/api/logout/`)
- [ ] E2E test passing
- [ ] Svelte autofixer run
- [ ] `npm run check` passes
