# Ministry budget and expense tracker

Status: Draft for testing-seam and ticket-breakdown review. Product scope confirmed by the user; implementation has not started.

## Problem Statement

A ministry budget owner requested a free spreadsheet to manage expenses. Spreadsheets are familiar and portable, but manually filling fields, categorizing purchases, and constructing views can make recording spending cumbersome. The developer wants to deliver a simpler input workflow and useful reporting without imposing a subscription on the owner. The actual owner's workflow has not yet been observed, so usability must be validated before committing to the full implementation.

## Solution

Build a private, responsive web application for phone and computer. One owner initially manages each ministry workspace, with invite-only onboarding performed by the operator. Provide a short purchase form, editable purchase plans, annual budgeting, and fixed reporting views with useful filters. Preserve spreadsheet portability and user-controlled backup export/import. Complement existing church accounting rather than replacing it.

Use SvelteKit on Cloudflare Workers with Static Assets and Cloudflare D1. Use Google sign-in. Target free plans, accepting service interruptions when free limits are reached instead of automatically upgrading. Omit receipts entirely from the first version. Validate the core workflow with the intended owner before completing the production application. Add an authenticated MCP interface later, using the same application rules.

## User Stories

1. As an owner, I want to sign in with my Google account so that I do not manage another password.
2. As an operator, I want to create a ministry workspace and invite its owner so that access starts under my control.
3. As an owner, I want my ministry's records isolated from other ministries so that only authorized members can access them.
4. As an owner, I want to use the same tracker on my phone and computer so that entry and review fit my routine.
5. As an owner, I want to configure my budget year's starting month so that reporting follows our annual cycle.
6. As an owner, I want one currency for my workspace so that totals have a consistent meaning.
7. As an owner, I want an overall annual budget so that I can track our available funds.
8. As an owner, I want optional category allocations so that I can use either simple overall budgeting or detailed budgeting.
9. As an owner, I want unallocated money shown explicitly so that category allocations reconcile to the overall budget.
10. As an owner, I want to transfer category allocations with a reason so that changes remain understandable.
11. As an owner, I want a starter category list so that setup is quick.
12. As an owner, I want to rename and archive categories so that the tracker can evolve without destroying history.
13. As an owner, I want to enter an actual purchase using only amount, category, description, and date so that entry stays short.
14. As an owner, I want today's date prefilled for an actual purchase so that routine entry requires less typing.
15. As an owner, I want optional vendor and notes so that I can preserve helpful details without mandatory extra fields.
16. As an owner, I want to split one purchase across categories so that category totals are accurate.
17. As an owner, I want optional event or initiative grouping so that I can see spending for a purpose across categories.
18. As an owner, I want to record tentative expected purchases so that I can see possible future spending.
19. As an owner, I want to distinguish commitments from tentative purchases so that available funds reflect obligations.
20. As an owner, I want anticipated dates on plans so that I can understand when spending may occur.
21. As an owner, I want to edit a plan easily so that changing estimates do not require recreating it.
22. As an owner, I want to settle a plan as an actual purchase so that planned and actual money are not double counted.
23. As an owner, I want to change the final amount, date, description, and category during settlement so that the actual record is accurate.
24. As an owner, I want to retain a planned remainder when only part is purchased so that the remaining intention is not lost.
25. As an owner, I want original estimates and edit history available in details so that I can understand how plans changed.
26. As an owner, I want to cancel plans without losing their history so that abandoned plans no longer affect balances.
27. As an owner, I want to delete accidental entries so that erroneous records can be removed.
28. As an owner, I want to record a dated refund against a purchase so that net spending and timing remain accurate.
29. As an owner, I want available funds to subtract actual net spending and commitments so that I can decide what remains spendable.
30. As an owner, I want a projected balance including expected purchases so that I can assess tentative plans separately.
31. As an owner, I want category balances so that I can understand where money has gone.
32. As an owner, I want spending over time so that I can understand seasonal patterns.
33. As an owner, I want searchable purchase history so that I can find individual records.
34. As an owner, I want date, category, and event filters so that I can inspect the same data in useful ways.
35. As an owner, I want prior budget years accessible so that I can review history and plan future years.
36. As an owner, I want to explicitly move outstanding plans into a new year so that rollover is deliberate.
37. As an owner, I want spreadsheet-compatible exports so that my data remains useful outside the application.
38. As an owner, I want to export a restorable backup so that I can keep a recoverable copy without automated backups.
39. As an owner, I want the last backup date and a gentle reminder after changes so that I remember to export.
40. As an owner, I want to preview a replacement restore so that I understand what will be removed and restored.
41. As an owner, I want to preview a merge so that I can add missing records without duplicating existing ones.
42. As an owner, I want to resolve conflicting imported versions so that old backups do not silently overwrite corrections.
43. As an owner, I want unsaved input preserved during connection trouble so that I do not lose typing.
44. As an owner, I want an explicit unsaved state so that I do not mistake a failed request for a recorded purchase.
45. As an owner, I want unaffected features to remain usable when one service hits a limit so that interruptions are contained where possible.
46. As an owner, I want normal entry to work without AI so that subscriptions are optional.
47. As an owner, I want a connected assistant to read, create, update, and permanently delete records through MCP so that I can use my preferred interface.
48. As an owner, I want assistant operations to obey the same financial and permission rules as the app so that switching interfaces does not change correctness.
49. As a maintainer, I want workspace membership separated from authentication so that future roles do not require redesigning data ownership.
50. As a maintainer, I want an owner-tested prototype so that technical ambition does not make the original spreadsheet task harder.

## Implementation Decisions

### Delivery and tenancy

- Private source code; no open-source release is planned initially.
- Multiple isolated ministry workspaces in one hosted service. One owner per workspace at launch, not a single globally shared owner account.
- Operator provisions a workspace and authorizes its owner. No public signup, subscription billing, or request-submitter roles initially.
- Google identity authenticates a person; explicit workspace membership authorizes access. Do not infer authorization from a supplied workspace identifier or successful Google login alone.
- Keep membership extensible for future roles, without shipping unneeded permission configuration now.
- Start with a disposable prototype and test with the intended owner using representative purchases, including a split receipt scenario without storing a receipt file.

### Hosting and modules

- SvelteKit provides frontend and server endpoints, deployed together to Cloudflare Workers with Static Assets. D1 stores structured data. No PocketBase, PostgreSQL, R2, or separate frontend host is required for the agreed initial scope.
- Shared application operations cover budgeting, purchase lifecycle, reporting, and data transfer. UI endpoints and later MCP tools invoke these operations rather than duplicating business rules.
- Use narrow storage and identity boundaries to support testing. Do not build a generic database abstraction or speculative provider migration framework.
- The owner does not pay a subscription. Free-tier exhaustion can interrupt operation. No automatic paid upgrade. The maintainer might later accept approximately $10/month, but this is not authorization to enable paid billing.
- Cloudflare manages hosting infrastructure; the maintainer still owns deployment, permissions, migrations, operational issues, and correctness.
- Internet is required to save. Preserve unfinished input locally, scope it to the signed-in context, and distinguish drafts from saved data. Offline synchronization is excluded.
- Contain failures where feasible; a shared Workers or D1 outage may affect many features. Never promise feature isolation when their common dependency is unavailable.

### Budget and classification

- Budget years have configurable starting month and a workspace currency. No currency conversion. Preserve historical year boundaries when settings change.
- Overall-only mode uses categories for reporting with no category limits. Allocation mode partitions the annual total into category allocations plus unallocated money.
- Allocation transfers retain a reason and history. No automatic equal monthly budget distribution and no automatic unused-money rollover.
- Prior years remain accessible; outstanding plans move only by explicit action.
- Optional reusable event/initiative labels group purchases across categories. They are not separate budgets in this version.
- Store money exactly using currency-appropriate minor units; avoid floating-point accounting.

Starter categories and guidance:

| Category                | Guidance                                       |
| ----------------------- | ---------------------------------------------- |
| Volunteers              | Appreciation, gifts, meals, celebrations       |
| Training                | Conferences, workshops, leadership development |
| Admin                   | Office supplies, printing, software            |
| Sunday Consumables      | Snacks, crafts, games, weekly supplies         |
| Classroom Supplies      | Toys, furniture, reusable equipment            |
| Events                  | Special events, parties, activities            |
| Parents                 | Parent resources, family engagement            |
| Discipleship            | Bibles, devotionals, spiritual growth          |
| Guest Experience        | Welcome gifts, first-time guest supplies       |
| Curriculum              | Lessons, teaching resources, subscriptions     |
| Production & Technology | AVL, technology, equipment                     |
| Environments            | Décor, signage, room improvements              |

Categories are editable and archivable; historical associations remain valid. The first category name is interpreted as Volunteers, with Appreciation among its descriptive examples.

### Purchases and plans

- Actual purchase requires amount, category allocation(s), description, and actual date. Default actual date to today. Vendor and notes are optional.
- Expected and committed plans require an anticipated date. One plan represents one intended purchase, not an event allowance.
- Expected means tentative; committed means agreed or ordered; actual means purchase recorded, not necessarily bank-cleared or reimbursed.
- Settle as actual prefills editable final details from the plan. Default settlement closes its planned amount and records the actual amount. The original estimate and revisions remain in history.
- Optional keep-remainder settlement leaves an explicitly reviewed remaining plan. Preserve the internal relationship without requiring the owner to manage links. Do not subtract both the settled amount and the original commitment.
- Splits must reconcile exactly to the total. Partial settlement of a split plan must show and validate how actual and remaining category amounts are allocated.
- Canceling a plan retains it but removes it from balances; canceled plans are hidden by default.
- Refunds are separate dated records attached to purchases. Default classification from the purchase; split-purchase refund allocations must be explicit and valid. Proposed invariant: cumulative refunds cannot exceed the purchase amount.
- Actual edits, settlement, refunds, and deletion update reports consistently. Permanent deletion is allowed; dependent splits/refunds must not be orphaned. No mandatory trash workflow is planned.
- Use atomic operations for financial transitions and imports. Prevent retries or stale browser submissions from settling a plan twice or silently overwriting later changes.

### Reporting

- Net actual spending = actual purchase amounts minus refunds.
- Available to spend = annual budget minus net actual spending minus outstanding commitments.
- Projected balance = available to spend minus expected amounts.
- Fixed category balance view, spending-over-time view, and searchable history; filter by date, category, and event/initiative.
- Show the annual scope of headline budget balances explicitly. Date-filtered activity totals must not be mislabeled as the full annual balance.
- Category balance exists only when category allocations are enabled. Otherwise show category spending, not fictitious category budgets.
- Preserve dates for refund timing. Proposed cross-year rule: apply a refund to the year containing its refund date, even if its original purchase was in a prior year; include this case in review and tests.

### Exports and restoration

- Spreadsheet-compatible exports of budgets and purchases include classifications, split data, plans, and refunds in a documented shape that does not multiply transaction totals accidentally.
- Separate versioned backup format preserves workspace configuration, budgets, categories, events, purchases, plans, refunds, record IDs, and history. No receipts exist to include.
- Backups are manual. Show last successful export time and changes since export; browser download initiation is not proof the owner retained a file.
- Never export Google credentials, session secrets, or MCP authorization tokens. A backup restores ministry data, not identity-provider access.
- Restore is restricted to the authorized workspace. A backup must not import access rights or overwrite other ministries.
- Replacement preview summarizes deletions and replacements, offers export first, and requires confirmation.
- Merge uses stable IDs: add missing records, skip identical ones, and surface conflicting versions. Default conflict choice keeps current data. Never deduplicate merely by equal amount/date.
- Propose a stable workspace-origin identifier for backup compatibility. Reject unrelated workspace merges initially rather than silently remapping identities.
- Validate format version, references, totals, and authorization before applying. Changes after preview invalidate or refresh that preview. Apply atomically or leave current data intact.
- Merge treats absence as absence, not deletion. Explicit deletion/version metadata should prevent resurrecting known deleted records silently; show such cases as conflicts. Restore previews must explain resulting record and balance changes.

### AI and MCP

- AI is not required for prototype or core pilot. No automatic categorization silently decides classifications.
- MCP is secondary, after core validation. Support authenticated read/create/update/permanent-delete using shared application operations and workspace authorization.
- Keep precise tool semantics for settlement, refunds, and deletion; authenticate the caller rather than trusting model-supplied identity arguments. Revoking a connection removes its access.
- MCP is a connectivity protocol, not a universal subscription entitlement. Validate ChatGPT/Claude client compatibility when implementing.
- Investigate Sign in with ChatGPT separately for private-hosted-app eligibility. Do not make it the application's required authentication or funding mechanism. No open-source release is authorized to qualify for it.

## Testing Decisions

Proposed seam, awaiting the required review: test observable application operations with an authenticated actor, workspace, and real disposable database; assert returned results, persisted behavior through public queries, and report totals. Exercise the same operations used by web endpoints and later MCP. This is the primary business-behavior seam. Add a small browser suite for user journeys and narrow protocol/deployment checks where this seam cannot prove behavior.

- Good tests verify externally visible outcomes, invariants, and permission boundaries, not internal helper calls, component structure, or snapshots mirroring implementation.
- Budget/purchase tests cover modes, transfers, split reconciliation, state transitions, editable settlement, remainder retention, cancellation, original estimate history, refunds, cross-year behavior, and permanent deletion.
- Reporting tests demonstrate no planned/actual double counting, correct net spending, meaningful filters, and negative balances when overspent.
- Data-transfer tests cover complete round trips, replace, repeat merge, conflicts, deletions, stale previews, malformed backups, incompatible origins, and failure without partial changes.
- Authorization tests use at least two workspaces and test guessed identifiers across read/write/delete/export/import and MCP paths.
- Retry/concurrency tests prove settlement, refunds, and restore cannot double-apply financial changes.
- Browser journeys cover phone and desktop entry, a split purchase, plan edits and settlement with/without remainder, refund entry, finding available budget, and unsaved input after failure.
- Prototype validation is a human usability gate: owner completes ordinary entry, split entry, plan/settlement, partial purchase, and finding available funds without coaching. Record friction and revise.
- Repository prior art: only a README exists at synthesis time; no test framework, existing seams, domain glossary, or ADRs were found. Choose tooling during implementation; use realistic Cloudflare/D1 integration behavior rather than mocking every database interaction.

## Out of Scope

- Official accounting, bank reconciliation, bank feeds, tax reporting, reimbursements, and payment execution.
- Receipt uploads, receipt links, extraction, and attachment backups.
- Public self-service onboarding, billing, additional user roles, submission requests, and approval workflows.
- Arbitrary dashboard layout/calculation builder, event-specific budgets, and monthly budget allocation engines.
- Offline saving/synchronization, desktop packaging, automated backups, and importing arbitrary third-party spreadsheets.
- Automatic category assignment without confirmation, embedded AI at launch, and guaranteed support for every AI subscription.
- Open-source release and automatic paid hosting upgrades.

## Further Notes

The user confirmed the overall product scope after the interview. This document synthesizes that scope; detailed guardrails labeled proposed are implementation recommendations, not additional interview answers.

Review the primary testing seam and ticket granularity before setting the local tickets ready-for-agent. The requested .scratch directory is the local tracker; no external issues are authorized or needed. No application code or deployed infrastructure is created by this planning task.

References checked during discussion (pricing and eligibility must be rechecked when deploying):

- https://developers.cloudflare.com/workers/framework-guides/web-apps/sveltekit/
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/r2/pricing/
- https://developers.openai.com/cookbook/articles/sign-in-with-chatgpt
- https://developers.openai.com/api/docs/guides/custom-mcp-server
