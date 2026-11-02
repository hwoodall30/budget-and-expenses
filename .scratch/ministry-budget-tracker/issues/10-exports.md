# 10: Export spreadsheet data and restorable backups

**What to build:** The owner downloads useful spreadsheet-compatible data and a complete versioned workspace backup.

**Blocked by:** 09: Explore spending and category balances.

**Status:** draft — pending testing-seam and ticket-breakdown review

- [ ] Export budgets, purchase classifications/splits, plans, and refunds without duplicating aggregate totals.
- [ ] Backup includes settings, stable identifiers, events, history, and relationships; excludes identity credentials and tokens.
- [ ] Show backup-export timestamp and gentle changes-since-export reminder without claiming a downloaded file is safely retained.
- [ ] Limit export to the authorized workspace and provide a format version and workspace-origin identifier.
- [ ] Validate exported data integrity and CSV escaping, including spreadsheet formula-like text.
