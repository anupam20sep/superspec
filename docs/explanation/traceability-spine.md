# Traceability spine

SuperSpec's binding link: every requirement maps to a task, every code task has a test, gaps are machine-checkable.

```
FR-###  ↔  Task T00X  ↔  Passing test  ↔  Verification gate
```

- **scope** writes `FR-###` in `spec.md`
- **plan** maps tasks to FRs (`**Implements:** FR-001`)
- **matrix** reports uncovered FRs
- **forge** implements one task at a time with TDD
- **validate** runs lint + matrix before ship

From `constitution.md`:

1. **Test-First** — red-green-refactor for **Kind: code** tasks
2. **Traceability** — no FR without a covering task and passing test
