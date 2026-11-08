---
name: as-test
description: Drives development with tests using the red-green-refactor loop. Use when implementing any logic, fixing any bug, or changing any behavior. Use when you need to prove that code works, or when you're about to modify existing functionality. Use when asked to add tests to a function, fix a bug in it or change its behavior, even when the code is pasted inline and the request does not mention tests.
---

# Test-Driven Development

A change with no behavioral impact (configuration, documentation, static content) skips RED and GREEN; say so in the report.

## Test Setup

Use the project's test runner and file layout; follow the patterns in neighboring tests. Inside the cycle, run only the test file being changed; when the cycle is done, run the full test suite.

## Implementation Rules

### Simplicity First

Before writing any code, ask: "What is the simplest thing that could work?"

After writing code, review it against these checks:
- Can this be done in fewer lines?
- Are these abstractions earning their complexity?

```
SIMPLICITY CHECK:
✗ Generic EventBus with middleware pipeline for one notification
✓ Simple function call

✗ Abstract factory pattern for two similar components
✓ Two straightforward components with shared utilities

✗ Config-driven form builder for three forms
✓ Three form components
```

Three similar lines of code is better than a premature abstraction. Implement the naive, obviously-correct version first.

### Scope Discipline

Touch only what the ticket needs: the files and lines its acceptance criteria require. Leave adjacent code, imports, comments and syntax in other files as they are, and add only the features the ticket asks for. When the change would push a file past about 1000 lines, split that file first, in the same ticket.

When you notice something worth improving outside the ticket, list it in your report instead:

```
NOTICED BUT NOT TOUCHING:
- A sibling module has an unused import (unrelated to this ticket)
- The settings form could use clearer error messages (separate ticket)
```

## The TDD Cycle

### Step 1: RED — Write a Failing Test

Write the test first and run it: it fails because the behavior is missing, not on a typo or import error. A test that passes immediately proves nothing.

```typescript
// RED: fails on the assertion, since addToCart is still a stub returning the cart unchanged
describe('addToCart', () => {
  it('lists the item afterwards', () => {
    const cart = addToCart([], { id: 42, name: 'Blue mug' });

    expect(cart).toEqual([{ id: 42, name: 'Blue mug' }]);
  });
});
```

### Step 2: GREEN — Make It Pass

Write the minimum code to make the test pass:

```typescript
// GREEN: Minimal implementation
export function addToCart(cart: CartItem[], item: CartItem): CartItem[] {
  return [...cart, item];
}
```

### Step 3: REFACTOR — Clean Up

With tests green, improve the code this cycle wrote, without changing behavior:

- Extract shared logic
- Improve naming
- Remove duplication

Run tests after every refactor step to confirm nothing broke.

Fixing a bug: the RED test reproduces the reported bug, before any fix.

## Writing Good Tests

### Test State, Not Interactions

Assert on the *outcome* a user sees, not on which functions were called internally. Tests that verify call sequences break when you refactor, even if the behavior is unchanged.

```typescript
// Good: Tests what the user sees
it('offers removal once the item is in the cart', async () => {
  renderComponent(CartButton, { item: { id: 42, name: 'Blue mug' } });
  await click(getByRole('button', { name: /add to cart/i }));
  expect(getByRole('button', { name: /remove from cart/i })).toBeVisible();
});

// Bad: Tests how the component works internally
it('calls the cart store', async () => {
  const add = spyOn(cartStore, 'add');
  renderComponent(CartButton, { item: { id: 42, name: 'Blue mug' } });
  await click(getByRole('button'));
  expect(add).toHaveBeenCalled();
});
```

Query elements by role and accessible name before test IDs.

### DAMP Over DRY in Tests

In production code, DRY (Don't Repeat Yourself) is usually right. In tests, **DAMP (Descriptive And Meaningful Phrases)** is better. A test should read like a specification — each test tells a complete story without requiring the reader to trace through shared helpers. Duplication in tests is acceptable when it makes each test independently understandable.

### Prefer Real Implementations Over Mocks

Use the simplest test double that gets the job done. The more your tests use real code, the more confidence they provide.

```
Preference order (most to least preferred):
1. Real implementation  → Highest confidence, catches real bugs
2. Fake                 → In-memory version of a dependency (an in-memory store)
3. Stub                 → Returns canned data, no behavior (a stub function resolving to fixed data)
4. Mock (interaction)   → Verifies calls — use sparingly
```

Mock only at boundaries that are slow, non-deterministic or external, such as a third-party API fetch. Over-mocking creates tests that pass while the app breaks.

### Use the Arrange-Act-Assert Pattern

```typescript
it('formats a duration over an hour as hours and minutes', () => {
  // Arrange
  const minutes = 139;

  // Act
  const result = formatDuration(minutes);

  // Assert
  expect(result).toBe('2h 19m');
});
```

### One Concept Per Test, Named Descriptively

Each test verifies one behavior, and its name reads like a specification:

```typescript
// Good
describe('formatDuration', () => {
  it('formats a duration over an hour as hours and minutes', ...);
  it('omits hours for a duration under an hour', ...);
  it('returns an empty string when the duration is unknown', ...);
});

// Bad: vague names, everything in one test
describe('formatDuration', () => {
  it('works', () => {
    expect(formatDuration(139)).toBe('2h 19m');
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(null)).toBe('');
  });
});
```

## Test Anti-Patterns to Avoid

| Anti-Pattern | Problem | Fix |
|---|---|---|
| Flaky tests (timing, order-dependent) | Erode trust in the test suite | Use deterministic assertions, isolate test state |
| Testing framework code | Wastes time testing third-party behavior | Only test YOUR code |
| Snapshot abuse | Large snapshots nobody reviews, break on any change | Use snapshots sparingly and review every change |
| No test isolation | Tests pass individually but fail together | Each test sets up and tears down its own state (clear shared storage, restore all mocks) |

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "Let me run the tests again just to be extra sure" | After a clean run, repeating the same command adds nothing unless the code has changed since. |

## Red Flags

- "All tests pass" but no tests were actually run
- Skipping tests to make the suite pass
