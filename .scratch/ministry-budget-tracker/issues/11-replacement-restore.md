# 11: Preview and restore a replacement backup

**What to build:** The owner previews replacing the current workspace data and confirms a validated restoration.

**Blocked by:** 10: Export spreadsheet data and restorable backups.

**Status:** draft — pending testing-seam and ticket-breakdown review

- [ ] Validate format, origin compatibility, references, amounts, and authorization before mutation.
- [ ] Preview removed/replaced records and balance effects; offer current-data export first.
- [ ] Exclude identity/access grants from restoration; never overwrite another workspace.
- [ ] Reject or refresh stale previews; commit all changes or none.
- [ ] Prove backup round trip and malformed/interrupted restore leaves existing data intact.
