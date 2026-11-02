# 08: Record refunds and remove erroneous purchases

**What to build:** The owner records dated refunds and permanently deletes erroneous records without leaving misleading balances.

**Blocked by:** 05: Classify purchases with splits and initiatives, 07: Settle plans and retain optional remainders.

**Status:** draft — pending testing-seam and ticket-breakdown review

- [ ] Refunds default to purchase classification and support explicit split allocations.
- [ ] Validate cumulative refund totals and apply the documented cross-year rule.
- [ ] Permanent deletion handles dependent splits/refunds and explains consequences for related plans.
- [ ] Recompute balances consistently and prevent dangling references or silent recreation of commitments.
- [ ] Verify retry safety, authorization, and effects on reports and history.
