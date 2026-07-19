# ⚠️ Conflict Resolution in Offline Environments

## Case Study 2: Connectivity Strategies in Distributed Systems

---

# 1. Transaction Append-Only Model

Sales receipts are **immutable business events**.
- POS clients do not modify old tickets offline.
- If a cashier voids a receipt, the POS generates a new independent **Refund/Credit Note event**.
- This append-only design eliminates logical database merge conflicts entirely.

---

# 2. Inventory Depletion (Negative Stock Rule)

What if two offline cash registers sell the last available item in stock simultaneously?

- **Chosen Policy: Permissive Over-Selling.**
- **Rationale:** The physical customer is standing at the register holding the item. Halting check-out due to digital database discrepancies is unacceptable.
- **Resolution:** The central server accepts both transactions, reducing central PostgreSQL stock into negative figures. The `Inventory Service` publishes an `inventory.alert` to RabbitMQ, which alerts the Angular administrator to re-order inventory.

---

# 3. Client Clock Drift (Out-of-Sync Time)

If a POS client has an incorrect computer clock, it could disrupt financial auditing.

- **Solution: Dual Timestamping.**
  1. `client_timestamp`: The exact time the event was recorded locally at the POS. Used for cash count-down and cash shifts.
  2. `server_timestamp`: The actual time the database row was inserted in PostgreSQL. Used for central accounting, audits, and tax reporting.

---

# Related Documents

- **ARCHITECTURE.md** — General system architecture.
- **SECURITY.md** — Authentication and security architecture.
- **SYNCHRONIZATION.md** — Event synchronization between clients and server.
- **CONFLICT_RESOLUTION.md** — Business conflict resolution.
- **TEST.md** — Unit testing strategy and automation.
- **DESIGNDECISIONS.md** — Design decisions and technology choices.
- **DEPLOYMENT.md** — Deployment and operations strategy.
- **RUNNING.md** — Project execution guide.
