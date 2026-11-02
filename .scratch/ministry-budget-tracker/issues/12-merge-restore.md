# 12: Preview and merge backup records

**What to build:** The owner imports missing data and resolves differences without duplicating unchanged records.

**Blocked by:** 11: Preview and restore a replacement backup.

**Status:** draft — pending testing-seam and ticket-breakdown review

- [ ] Stable IDs distinguish new, identical, conflicting, and known-deleted records.
- [ ] Default conflicting records to keep current; show alternative versions and resulting balance changes.
- [ ] Do not match records solely by equal amount or date, and do not treat absence as deletion.
- [ ] Prevent silent resurrection and reject unsupported cross-workspace merges.
- [ ] Apply only a fresh validated preview atomically; repeated identical import is idempotent.
