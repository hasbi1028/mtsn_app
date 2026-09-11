# test-plan.md — Test Plan Template

> Setiap module harus punya test plan sebelum code ditulis.

---

## Module: [Nama Module]

### Test Strategy

| Level | Tool | Coverage |
|-------|------|----------|
| E2E | Playwright | User flows (happy path + error) |
| Unit | Vitest | Server logic (validation, DB queries) |
| Integration | Vitest | Remote function + DB |

### E2E Scenarios

#### 1. [Happy Path]
```gherkin
Given user is logged in as [role]
When user navigates to /[module]
Then page shows [expected content]
```

#### 2. [CRUD Operation]
```gherkin
Given user is on /[module]/new
When user fills form with valid data
And user clicks submit
Then success toast appears
And user is redirected to /[module]
```

#### 3. [Validation Error]
```gherkin
Given user is on /[module]/new
When user submits empty form
Then validation errors are shown
And form is not submitted
```

#### 4. [Authorization]
```gherkin
Given user is logged in as [role]
When user tries to access /[admin-only]
Then user sees 403 error
```

### Unit Test Scenarios

#### 1. [Query Function]
```ts
test('getXxxList returns paginated results', async () => {
  // mock DB
  const result = await getXxxList({ page: 1 });
  expect(result).toHaveLength(20);
});
```

#### 2. [Form Validation]
```ts
test('createXxx validates required fields', async () => {
  await expect(createXxx({})).rejects.toThrow('Required');
});
```

#### 3. [Business Logic]
```ts
test('allocateSiswa checks capacity', async () => {
  // mock full rombel
  await expect(allocateSiswa({ rombel_id: 1, siswa_ids: [1] }))
    .rejects.toThrow('Kapasitas penuh');
});
```

### Test Data Setup

- Use `tests/e2e/helpers.ts` for shared utilities
- Each test file sets up its own data
- Clean up after each test

### Coverage Targets

| Metric | Target |
|--------|--------|
| E2E happy paths | 100% |
| E2E error paths | 80% |
| Unit tests | 70% |
| Branch coverage | 60% |

### Running Tests

```bash
# E2E tests
npx playwright test tests/e2e/[module].spec.ts

# Unit tests
npx vitest run src/lib/server/[module]/**/*.test.ts

# All tests
npm run test && npx playwright test
```

### CI/CD Integration

- Tests run on every commit
- E2E tests run on PR
- Coverage report generated
- Block merge if coverage drops
