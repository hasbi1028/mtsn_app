# spec.md — Dashboard Module

## Module: Dashboard

### User Story

As an admin, I want to see school statistics at a glance so that I can monitor operations.

### Acceptance Criteria

- [ ] Show total PTK, guru, sertifikasi, belum sertifikasi
- [ ] Show total siswa, per kelas
- [ ] Show rombel allocation status
- [ ] Show bansos distribution (PKH, PBI, sembako)
- [ ] Show SKMT/SKBK/SKAKPT pending counts
- [ ] Data loads on page visit (SSR)

### Out of Scope

- Charts/graphs (future)
- Export (future)

---

## Remote Functions

### src/routes/+page.server.ts

```ts
import { db } from '$lib/server/db';
import { ptk, siswa, rombel, skmt_ajuan, skbk_ajuan, skakpt } from '$lib/server/db/schema';
import { count, eq } from 'drizzle-orm';

export const load = async () => {
  const totalPtk = db.select({ count: count() }).from(ptk).get();
  const totalSiswa = db.select({ count: count() }).from(siswa).get();
  const totalRombel = db.select({ count: count() }).from(rombel).where(eq(rombel.aktif, 1)).get();
  const pendingSkmt = db.select({ count: count() }).from(skmt_ajuan).where(eq(skmt_ajuan.status, 'Menunggu')).get();
  const pendingSkbk = db.select({ count: count() }).from(skbk_ajuan).where(eq(skbk_ajuan.status, 'Belum Diajukan')).get();

  return {
    ptk: totalPtk.count,
    siswa: totalSiswa.count,
    rombel: totalRombel.count,
    pendingSkmt: pendingSkmt.count,
    pendingSkbk: pendingSkbk.count
  };
};
```

---

## E2E Test

```ts
// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('shows statistics cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Dashboard');
    // Check stats are visible
  });
});
```
