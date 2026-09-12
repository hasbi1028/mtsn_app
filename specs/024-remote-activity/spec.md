# spec.md — 024 Remote Activity

> Activity log via remote query. No `+page.server.ts`.

---

## Module: Activity Log

### User Story

As an admin, I want to view the activity log so that I can audit user actions in the system.

### Acceptance Criteria

- [ ] Activity page uses `getActivityLogQ` remote query
- [ ] Shows: timestamp, username, action, detail
- [ ] Sorted by newest first
- [ ] Limited to 50 entries
- [ ] No `+page.server.ts` in `/activity`

### Edge Cases

- Empty activity log → show "Belum ada aktivitas"
- User deleted but has activity → show username from JOIN

---

## Data Model

| Table | Columns Used |
|-------|-------------|
| `activity_log` | `id`, `user_id`, `action`, `detail`, `created_at` |
| `users` | `id`, `username` |

---

## Remote Contract

```ts
export const getActivityLogQ = query(async () => getActivityLog());
```

---

## E2E Test

- `tests/e2e/activity.spec.ts` — already exists, needs enhancement:
  - activity page loads with heading
  - activity list visible or empty state
  - entries sorted by time

---

## Migration Checklist

- [x] Service layer created
- [x] Remote wrapper created
- [ ] E2E tests enhanced
- [ ] `npm run check` passes
