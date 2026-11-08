# Error-Specific Triage

```
Test fails after code change:
├── Did you change code the test covers?
│   ├── Test is outdated → Update the test
│   └── Code has a bug  → Fix the code
├── Did you change unrelated code? → Likely a side effect: shared state, imports, globals
└── Test was already flaky? → Timing, order dependence, unrestored mocks

Build or typecheck fails:
├── Type error       → Read the error, check the types at the cited location
├── Import error     → Check the module exists, exports match, paths are correct
├── Config error     → Check config files for syntax/schema issues
└── Dependency error → Check the manifest, reinstall dependencies

Runtime error:
├── Cannot read properties of undefined → trace where the value comes from
├── Hydration mismatch → server and client render differently (browser-only APIs like
│                        localStorage read during render)
└── Unexpected behavior, no error → assert the data at each step in a test
```

Add temporary logging only when you can't localize the failure otherwise, and remove it once the test guards the fix.
