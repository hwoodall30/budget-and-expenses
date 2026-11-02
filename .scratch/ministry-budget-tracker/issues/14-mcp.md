# 14: Operate the tracker through authenticated MCP

**What to build:** As a secondary feature, an authorized owner connects a compatible assistant to read, create, update, and permanently delete tracker records.

**Blocked by:** 13: Handle interruptions and release the core pilot.

**Status:** draft — pending testing-seam and ticket-breakdown review

- [ ] Use the same application operations, validation, and financial transitions as the web app.
- [ ] Authenticate the connection, scope it to authorized workspaces, and support revocation.
- [ ] Expose clear settlement, refund, and deletion semantics; permanent delete is supported without mandatory trash.
- [ ] Verify cross-workspace denial, retry behavior, connection revocation, and deletion effects through MCP.
- [ ] Validate the intended ChatGPT/Claude connection paths and document client/account requirements without promising universal subscription support.
