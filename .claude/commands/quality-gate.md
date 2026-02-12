# Quality Gate

Run all quality checks. ALL must pass before committing or creating a PR.

## Checks (run in order)

### 1. Lint and Format
```bash
pnpm biome check --write .
```
Fix any remaining issues that `--write` couldn't auto-fix.

### 2. Type Check
```bash
pnpm tsc --noEmit
```
Fix all type errors. No `any` types unless absolutely necessary (add biome-ignore comment with reason).

### 3. Unit and Integration Tests
```bash
pnpm vitest run
```
All tests must pass. If any fail, fix the implementation (not the test, unless the test itself is wrong).

### 4. E2E Tests (if applicable)
```bash
pnpm playwright test
```
All E2E tests must pass.

## Failure Protocol

If any check fails:
1. Read the error output carefully
2. Fix the root cause (not a workaround)
3. Re-run the failing check
4. If it passes, re-run ALL checks from the beginning (fixes can introduce new issues)
5. Repeat until all 4 checks pass in sequence

## Success

When all checks pass:
```
Quality Gate: PASSED
──────────────────────
✓ Biome (lint + format)
✓ TypeScript (type check)
✓ Vitest (unit + integration)
✓ Playwright (E2E)
```

Proceed to commit and PR creation.
