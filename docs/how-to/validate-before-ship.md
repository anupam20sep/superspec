# Validate before ship

---

## When

After `forge-status` reports `complete: true`, run **superspec-validate** before merge or release.

---

## Commands

```bash
npx -y @superspec-dev/core lint --spec specs/<feature>/spec.md
npx -y @superspec-dev/core lint --plan specs/<feature>/plan.md
npx -y @superspec-dev/core lint --design specs/<feature>/design.md --specs-root .
npx -y @superspec-dev/core matrix --spec specs/<feature>/spec.md --plan specs/<feature>/plan.md
```

Run your project's test suite (from `plan.md` commands).

Empty `[]` from lint = pass. Matrix should have no gaps.

---

## Ship

Use **superspec-ship** for merge / PR / cleanup options after validation passes.

---

## Related

- [superspec-validate skill](../../skills/superspec-validate/SKILL.md)
