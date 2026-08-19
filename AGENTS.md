# Agent Guidelines

## Permissions

```json
{
  "permission": {
    "bash": {
      "git stash *": "ask",
      "git commit *": "ask",
      "git push *": "deny",
      "git reset --hard *": "deny",
      "git clean *": "deny",
      "git branch -D *": "deny",
      "git checkout .": "deny",
      "git restore .": "deny"
    }
  }
}
```

## File Modification Scope

- Only modify files explicitly named in the user's prompt or files that are strictly required to implement the requested change.
- Do NOT modify unrelated files for cleanup, formatting, refactoring, optimization, modernization, or consistency.
- Do NOT modify neighboring components just because they use similar code.
- If another file appears to require changes, STOP and report:
  1. file path
  2. why it needs modification
  3. exact change required
- Wait for explicit user approval before modifying additional files.

## Pre-Modification Audit

Before modifying any file:

1. Identify the exact files that will be changed.
2. Explain why each file must change.
3. Identify files that must NOT change.
4. Do not begin implementation until the scope is clear.

If the task can be completed without changing an additional file, do not change it.

## No Opportunistic Changes

Do NOT:
- refactor unrelated code
- rename unrelated variables
- reorganize imports in unrelated files
- reformat unrelated files
- fix unrelated bugs
- update dependencies unless explicitly requested
- modify CSS unrelated to the requested feature
- improve existing components unrelated to the task
- remove "unused" code unless required
- change architecture unless explicitly requested

## Scope Expansion

If implementation requires modifying a file that was not included in the original task:

STOP implementation.

Report:

UNPLANNED FILE:
path/to/file

REASON:
Why this file appears necessary.

PROPOSED CHANGE:
What would be changed.

Do NOT modify the file until the user explicitly approves it.

## Database Safety

By default, database operations must be READ-ONLY.

Allowed without approval:
- SELECT
- DESCRIBE / \d
- information_schema queries
- schema inspection
- EXPLAIN
- migration inspection

Require explicit user approval before:
- INSERT
- UPDATE
- DELETE
- DROP
- ALTER
- TRUNCATE
- database migrations
- data repair scripts

## Critical Files

The following files require explicit user approval before modification:

backend/app/services/payment_service.py
backend/app/services/invoice_service.py
backend/app/services/work_order_service.py
backend/app/services/work_order_part_service.py
database/*