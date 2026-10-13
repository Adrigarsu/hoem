---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "tests/**"
---

# Tests

- Test files sit next to the code they test: `split-expense.ts` → `split-expense.test.ts`.
  End-to-end specs live in `tests/e2e/`, one per user story.
- Each `it` starts with the requirement ID and states the behaviour, not the implementation:
  `it("FR-EXP-004 gives the leftover cent to the payer", …)`.
- Arrange–Act–Assert, one behaviour per test. No logic (loops, ifs) inside tests.
- Domain tests use plain values: no mocks, no database, no React.
- Component tests use Testing Library queries in this order: `getByRole` (with `name`),
  `getByLabelText`, `getByText`. Avoid `getByTestId`; never query by class name.
- Interact with `@testing-library/user-event`, not `fireEvent`.
- Never weaken or delete a failing test to make it pass. Fix the code or ask.
