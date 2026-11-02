# Prototype implementation review

Baseline: `3a7d39483d75d90469bf766265b5b785545907a9`.
Scope: ticket 01, disposable sample-data workflows at `/`.

## Validation

- Typecheck: `bun run check` — no errors or warnings.
- Unit/component suite: `bun run test:unit -- --run` — 13 tests passed.
- Browser suite: `bunx playwright test` — 4 tests passed, including 390px and 1280px workflows. This also builds the production bundle.
- Prettier and ESLint checks passed for all changed application and test files; owner-trial documentation passes Prettier.
- Browser checks cover entry, partial settlement, split reconciliation with edit preservation, plan editing/commitment, editable full settlement, refresh reset, and horizontal overflow.

## Standards

Independent review found no material findings. Svelte 5 runes, per-component sample state, and explicit attempt-result handling follow project guidance. Similar actual/remainder allocation markup was considered acceptable for a disposable prototype.

## Spec

Independent review found one implementation issue: settlement initially defaulted to today instead of prefilling the plan date. Corrected to prefill the plan date while keeping it editable; a browser regression assertion reproduced the failure before the fix. No other implementation gaps or material scope creep were found.

Review totals: Standards 0 findings; Spec 1 finding, corrected. Human owner validation remains pending.

## Human acceptance

Intended-owner phone and computer sessions remain pending. See [owner trial](owner-trial.md). No interaction is recorded as validated, and ticket 01 remains ready-for-human rather than complete.

## Follow-up: shared UI and purchase corrections

Baseline: `32a5f7e` (after the updated agent guidance).

- Replaced the prototype's scoped CSS with Tailwind layout utilities and semantic theme tokens.
- Installed official shadcn-svelte Card, Field, Input, NativeSelect, Badge, Alert, Checkbox, and Empty primitives with their dependencies; reused the existing Button.
- Extracted category splitting into a focused app component with bindable rows, element prop forwarding, class overrides, and a children snippet. The caller composes the surrounding FieldSet, legend, description, and split action.
- Added editing and deletion for all purchase records, including settled actuals. Actuals remain actual; corrections and deletions immediately update annual and category totals. A retained remainder remains independently planned.
- Validation: 18 unit/component tests and 5 Playwright tests passed. Browser tests cover correction/deletion of ordinary and settled actuals, remainder preservation, deleting each record type, and phone/desktop workflows. Typecheck, changed-file ESLint, and Prettier passed.

### Follow-up review results

Standards: 1 composition finding, corrected by reducing the custom allocation component to a focused row editor and moving the surrounding FieldSet, legend, description, and split actions to the caller. The row editor supports a children snippet for caller-composed actions.

Spec: 0 findings; all requested UI and purchase-correction behavior is implemented. Human owner validation remains pending.
