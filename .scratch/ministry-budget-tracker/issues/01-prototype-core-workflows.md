# 01: Validate the owner’s core workflow

**What to build:** Give the intended owner a responsive sample-data prototype covering entry, plans, settlement, and budget review before committing to the production design.

**Blocked by:** None (can start immediately after draft review).

**Status:** ready-for-human — prototype implemented; intended-owner validation pending

- [x] Demonstrate ordinary purchase entry, category split, expected/committed plan, editable settlement, and retaining a planned remainder.
- [x] Show available and projected balances with no double counting using representative sample data.
- [ ] Owner attempts five representative tasks on phone and computer without coaching; capture friction and revise.
- [ ] Document the validated interaction decisions and explicitly distinguish sample data from persisted production data.

## Comments

Implemented the disposable in-memory prototype at `/`. Public budget-operation and Playwright workflow seams, plus review baseline `3a7d394`, were approved in the implementation conversation. No production persistence or authentication is included.

The [owner trial guide](../../../docs/prototype/owner-trial.md) contains five uncoached tasks for phone and computer, a friction log, and candidate interaction decisions. Owner sessions and any resulting revisions remain pending; no interaction has been claimed as validated. This ticket remains the production-design gate.
