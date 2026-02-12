# Write Tests for Issue #$ARGUMENTS (TDD Red Phase)

Write comprehensive tests BEFORE any implementation code for issue #$ARGUMENTS. This is the RED phase of TDD.

## Process

### 1. Read the Issue
```bash
gh issue view $ARGUMENTS --repo seanRoshan/AlgoMotion
```

Extract all acceptance criteria, expected behaviors, and edge cases.

### 2. Plan Test Coverage

For each acceptance criterion, plan at least one test. Consider:
- **Happy path**: Normal expected behavior
- **Edge cases**: Boundary values, empty states, maximum values
- **Error cases**: Invalid input, network failures, missing data
- **Integration**: How this feature interacts with other modules
- **UI behavior**: Component rendering, user interactions (if applicable)
- **Store behavior**: State mutations, subscriptions (if Zustand stores involved)
- **Canvas behavior**: Pixi.js scene graph changes (if canvas features involved)

### 3. Write Tests

Create test files in the appropriate locations:
- Unit tests: colocated as `src/**/*.test.ts` or `src/**/*.test.tsx`
- Integration tests: `tests/integration/*.test.ts`
- E2E tests: `tests/e2e/*.spec.ts`

Use these testing patterns:
- **Vitest** for unit and integration tests
- **@testing-library/react** for component tests
- **Playwright** for E2E tests
- Use `describe`/`it` blocks with clear, descriptive names
- Use `beforeEach`/`afterEach` for setup and teardown
- Mock external dependencies (Supabase, fetch, etc.)
- For Zustand stores: test with actual store instances, not mocks
- For Pixi.js: mock the canvas/WebGL context

### 4. Verify Tests Fail

```bash
pnpm vitest run --reporter=verbose
```

All new tests should FAIL because the implementation doesn't exist yet. If any test passes, it's either testing existing functionality (which is fine) or the test is wrong (fix it).

### 5. Report

List all tests written with their status (should be FAIL):
```
Tests for Issue #$ARGUMENTS
────────────────────────────
✗ {test name} — {what it tests}
✗ {test name} — {what it tests}
...
Total: {count} tests, all failing (ready for implementation)
```
