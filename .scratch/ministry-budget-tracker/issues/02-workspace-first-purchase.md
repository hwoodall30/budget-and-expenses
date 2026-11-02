# 02: Sign in and record a workspace-isolated purchase

**What to build:** An operator provisions a ministry and its owner; that owner signs in with Google and records and retrieves an actual purchase in the deployed SvelteKit application.

**Blocked by:** 01: Validate the owner’s core workflow.

**Status:** draft — pending testing-seam and ticket-breakdown review

- [ ] Deploy frontend and server endpoints to Workers Free with D1; no paid upgrade or attachment service.
- [ ] Operator can provision a workspace and authorize its Google-authenticated owner without public signup.
- [ ] Seed the twelve agreed categories and collect amount, category, description, and default-today date; vendor and notes optional.
- [ ] Purchase survives reload and is available on phone and desktop.
- [ ] Uninvited identities and another workspace cannot read or mutate records by guessing identifiers.
- [ ] Verify the end-to-end journey and shared operation behavior against a disposable database.
