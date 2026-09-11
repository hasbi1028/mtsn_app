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

## Domain Module Structure

```
src/modules/[domain]/
├── [domain].validation.ts    # Valibot schemas
├── [domain].service.ts       # Pure business logic (DB queries)
├── [domain].remote.ts        # Thin wrapper (SvelteKit bridge)
└── components/
    └── *.svelte              # UI components
```

### Validation (validation.ts)

```ts
import * as v from 'valibot';

export const schema = v.object({
  field1: v.pipe(v.string(), v.nonEmpty()),
  field2: v.number()
});

export type SchemaType = v.InferOutput<typeof schema>;
```

### Service (service.ts)

```ts
import { db } from '$lib/server/db';
import { table } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export function getXxxList(args: { q?: string; page?: number }) {
  return db.select().from(table).where(...).all();
}

export function createXxx(data: SchemaType) {
  return db.insert(table).values(data).run();
}
```

### Remote (remote.ts)

```ts
import { form, query, command } from '$app/server';
import { schema } from './[domain].validation';
import { getXxxList, createXxx } from './[domain].service';

export const getXxx = query(schema, async (args) => {
  return getXxxList(args);
});

export const createXxxRemote = form(schema, async (data) => {
  createXxx(data);
  void getXxx.refresh();
  redirect(303, '/xxx');
});
```

### Component (components/*.svelte)

```svelte
<script>
  import { getXxx } from '../[domain].remote';
  import { PageLayout } from '$lib/components/page-layout';

  const data = getXxx({ page: 1 });
</script>

<PageLayout title="[Module]">
  {#await data}
    <p>Loading...</p>
  {:then rows}
    {#each rows as row}
      <p>{row.nama}</p>
    {/each}
  {/await}
</PageLayout>
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
});
```

---

## Migration Checklist

- [ ] Spec reviewed & approved
- [ ] Validation schema created (`[domain].validation.ts`)
- [ ] Service layer created (`[domain].service.ts`)
- [ ] Remote wrapper created (`[domain].remote.ts`)
- [ ] UI components created/moved to module
- [ ] Page updated (`+page.svelte`) — imports from module
- [ ] Old files deleted (`+page.server.ts`, `data.remote.ts`)
- [ ] E2E test written & passing
- [ ] Svelte autofixer run
- [ ] `npm run check` passes
- [ ] Committed with conventional commit message
