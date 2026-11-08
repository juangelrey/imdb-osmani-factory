# The Prove-It Pattern (Bug Fixes)

When a bug is reported, start by writing a test that reproduces it, before any fix.

```
Bug report arrives
       │
       ▼
  Write a test that demonstrates the bug
       │
       ▼
  Test FAILS (confirming the bug exists)
       │
       ▼
  Implement the fix
       │
       ▼
  Test PASSES (proving the fix works and guarding against recurrence)
```

**Example:**

```typescript
// Bug: "Adding the same item twice lists it twice"

// Step 1: Write the reproduction test (it should FAIL)
it('keeps one entry when the same item is added twice', () => {
  addToFavorites({ id: 42, name: 'Blue mug' });
  addToFavorites({ id: 42, name: 'Blue mug' });

  expect(getFavorites()).toHaveLength(1); // This fails → bug confirmed
});

// Step 2: Fix the bug
export function addToFavorites(item: FavoriteItem): void {
  const list = getFavorites();
  if (list.some((entry) => entry.id === item.id)) return; // This was missing
  localStorage.setItem('favorites', JSON.stringify([...list, item]));
}

// Step 3: Test passes → bug fixed, regression guarded
```
