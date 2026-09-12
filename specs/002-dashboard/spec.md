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

## Data Model

### Tables Used

| Table | Columns | Purpose |
|-------|---------|---------|
| `ptk` | `fungsi`, `sertifikasi` | PTK stats |
| `siswa` | `kelas`, `bansos_*` | Siswa + bansos stats |
| `rombel` | `aktif` | Rombel stats |
| `skmt_ajuan` | `status` | Pending SKMT |
| `skbk_ajuan` | `status` | Pending SKBK |
| `skakpt` | `status` | Pending SKAKPT |

---

## Domain Module Structure

```
src/modules/dashboard/
└── dashboard.service.ts    # DB queries (no remote needed)
```

### dashboard.service.ts

```ts
export function getGeneralStats() {
  // Returns: { totalPtk, guru, sertifikasi, belumSertifikasi, totalSiswa, pendingSkmt, pendingSkbk, pendingSkakpt }
}

export function getRombelStats() {
  // Returns: { totalRombel, totalSiswa, teralokasi, tanpaRombel, perKelas }
}

export function getBansosStats() {
  // Returns: { totalSiswa, belumCek, sudahCek, layakPkh, layakSembako, layakPbijk, desilDist, kelasDist }
}
```

### +page.server.ts

```ts
export const load = async () => {
  const stats = getGeneralStats();
  const rombelStats = getRombelStats();
  const bansosStats = getBansosStats();
  return { stats, rombelStats, bansosStats };
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
  });

  test('shows PTK count', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=PTK')).toBeVisible();
  });

  test('shows Siswa count', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Siswa')).toBeVisible();
  });
});
```

---

## Migration Checklist

- [ ] Spec reviewed & approved
- [ ] E2E test written
- [ ] Test runs and fails (red)
- [ ] Service layer created
- [ ] +page.server.ts updated
- [ ] Test passes (green)
- [ ] Svelte autofixer run
- [ ] `npm run check` passes
- [ ] Committed
