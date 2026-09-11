# spec.md — Template untuk Setiap Module

> Copy template ini ke `specs/NNN-name/spec.md` dan isi sesuai module.

---

## Module: [Nama Module]

### User Story

As a [role], I want [action] so that [benefit].

**Roles:**
- `admin` — Full akses
- `guru` — Akses terbatas (wali kelas, PTK sendiri)
- `siswa` — Self-service (profil sendiri)
- `orangtua` — Lihat data anak

### Acceptance Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

### Edge Cases

- What happens when [edge case]?
- Error handling for [scenario]?

### Out of Scope

- [Feature] TIDAK termasuk dalam phase ini

---

## Data Model

### Tabel yang terlibat

| Table | Columns Used | Relation |
|-------|-------------|----------|
| `table_name` | `col1`, `col2` | FK → `other_table.id` |

### Query Pattern

```sql
-- Read pattern
SELECT ... FROM table WHERE ... ORDER BY ... LIMIT ...;

-- Write pattern
INSERT INTO table (...) VALUES (...);
UPDATE table SET ... WHERE id = ?;
DELETE FROM table WHERE id = ?;
```

---

## Remote Functions

### Queries (READ)

```ts
// src/routes/[module]/data.remote.ts
import * as v from 'valibot';
import { query } from '$app/server';
import { db } from '$lib/server/db';
import { auth } from '$lib/server/auth';

export const getXxxList = query(
  v.object({
    q: v.optional(v.string()),
    page: v.optional(v.number(), 1)
  }),
  async ({ q, page }) => {
    const user = await auth.getUser();
    if (!user) error(401, 'Unauthorized');
    // query logic
    return result;
  }
);
```

### Forms (WRITE)

```ts
export const createXxx = form(
  v.object({
    field1: v.pipe(v.string(), v.nonEmpty()),
    field2: v.number()
  }),
  async (data) => {
    const user = await auth.getUser();
    if (!user) error(401, 'Unauthorized');
    // insert logic
    void getXxxList.refresh(); // single-flight mutation
    redirect(303, '/xxx');
  }
);
```

### Commands (WRITE from event handler)

```ts
export const deleteXxx = command(v.number(), async (id) => {
  const user = await auth.getUser();
  if (!user) error(401, 'Unauthorized');
  // delete logic
  void getXxxList.refresh();
});
```

---

## UI Components

### Page Structure

```svelte
<!-- src/routes/[module]/+page.svelte -->
<script>
  import { getXxxList, createXxx } from './data.remote';
  import { PageLayout } from '$lib/components/page-layout';
  import { DataTable } from '$lib/components/data-table';
  import { Button } from '$lib/components/ui/button';
  import { notify } from '$lib/toast';

  const data = getXxxList({ page: 1 });

  const columns = [
    { accessor: 'nama', header: 'Nama' },
    { accessor: 'status', header: 'Status' }
  ];
</script>

<PageLayout title="[Module]" description="[Description]">
  {#await data}
    <p>Loading...</p>
  {:then rows}
    <DataTable {columns} data={rows} />
  {:catch error}
    <p>Error: {error.message}</p>
  {/await}
</PageLayout>
```

### Form Pattern

```svelte
<form {...createXxx.enhance(async (form) => {
  if (await form.submit()) {
    notify.success('Berhasil disimpan!');
  } else {
    notify.error('Gagal menyimpan');
  }
})}>
  <input {...createXxx.fields.nama.as('text')} />
  <button>Simpan</button>
</form>
```

---

## E2E Test

```ts
// tests/e2e/[module].spec.ts
import { test, expect } from '@playwright/test';

test.describe('[Module]', () => {
  test('can list items', async ({ page }) => {
    await page.goto('/[module]');
    await expect(page.locator('h1')).toContainText('[Module]');
  });

  test('can create item', async ({ page }) => {
    await page.goto('/[module]/new');
    await page.fill('input[name="nama"]', 'Test Item');
    await page.click('button[type="submit"]');
    await expect(page.locator('.toast')).toContainText('Berhasil');
  });
});
```

---

## Migration Checklist

- [ ] Spec reviewed & approved
- [ ] Drizzle schema updated (if new table/columns)
- [ ] Remote functions created (`data.remote.ts`)
- [ ] Page updated (`+page.svelte`)
- [ ] Old `+page.server.ts` deleted (if fetch removed)
- [ ] E2E test written & passing
- [ ] Svelte autofixer run
- [ ] `npm run check` passes
- [ ] Committed with conventional commit message
