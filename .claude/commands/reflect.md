---
description: Reflect on this session and update the repo's agent infrastructure (CLAUDE.md, docs, skills) so the next session is more efficient.
argument-hint: "[optional focus, e.g. 'pdf' or 'just CLAUDE.md']"
---

You are running an active-learning reflection pass on the session so far. The goal is to
capture knowledge that was re-derived during this session so a future agent does not pay
that cost again.

Optional focus from the user: $ARGUMENTS

## 1. Review the session for friction

Scan the conversation above for moments where effort was spent learning something that
should have been known up front. Look specifically for:

- **Re-derived knowledge** - a fact about how this repo works that you had to discover by
  reading code, running commands, or trial and error (file locations, schemas, build
  steps, naming conventions).
- **Gotchas and dead ends** - a command that failed, a wrong assumption, an environment
  quirk, a tool that misbehaved, anything you would warn the next agent about.
- **Corrections from the user** - explicit feedback on how to do things in this repo.
- **Repeated multi-step procedures** - a sequence you executed that could be a documented
  command or skill.

If nothing in this session is worth capturing, say so plainly and stop. Do not invent
findings or make cosmetic edits.

## 2. Decide where each finding belongs

- **Repo-wide operational knowledge** (commands, gotchas, where things live, conventions)
  -> `CLAUDE.md` at the repo root. Keep it tight; it loads every session. Point to deeper
  docs rather than duplicating them.
- **Domain detail** (architecture, specs, the lab authoring flow) -> the relevant file
  under `docs/`. Update it and make sure `CLAUDE.md` links to it.
- **A repeatable procedure** -> propose a new `.claude/commands/<name>.md` command, but do
  not create it without confirming with the user first.
- **Knowledge specific to you / the user, not the repo** (personal preferences, things a
  teammate would not want committed) -> your memory, not the repo.

## 3. Propose, then apply

List the findings and where each one goes as a short bullet list. For straightforward
additions to `CLAUDE.md` or `docs/`, apply them directly. For anything larger (a new
command, a new skill, a structural doc change), confirm with the user before writing.

## 4. Respect repo conventions

- Never use em dashes (`-`) in anything you write.
- Match the existing style of `CLAUDE.md` and the surrounding docs.
- Do not duplicate what `docs/SPEC.md`, the ADRs, or existing docs already record - link
  to them instead.
- Keep edits minimal and high-signal. This file should make future sessions shorter, not
  add noise.
