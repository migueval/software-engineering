# 🔄 Sincronización de Datos y Consistencia Eventual

## Case Study 2: Connectivity Strategies in Distributed Systems

---

# Eventual Consistency (CAP Theorem)

In accordance with the CAP Theorem, during a network partition (P), a distributed system must choose between Consistency (C) and Availability (A).

- **Central Server:** Prioritizes **Consistency (CP)**.
- **POS Desktop Client:** Prioritizes **Availability (AP)**.
- **Eventual Consistency:** Synchronization occurs asynchronously. Central databases will eventually converge once network connectivity returns.

---

# Local Sync Event Log Structure

The POS registers transactions in a local SQLite event log:

```sql
CREATE TABLE local_sync_events (
    event_id TEXT PRIMARY KEY,       -- UUID v4 generated on the client
    action TEXT NOT NULL,            -- e.g., 'SALE_CREATED'
    payload TEXT NOT NULL,           -- Serialized JSON
    status TEXT DEFAULT 'PENDING',   -- PENDING, SENDING, RETRY_PENDING, SYNCED
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    synced_at TIMESTAMP
);
```

---

# Client Sync Engine State Machine

The client background sync worker uses an **exponential backoff** retry policy for temporary errors:

```text
Delay = min(2^retry_count * 1000 ms, 300000 ms)
```

---

# Server-Side Idempotence

To prevent duplicate billing (double spending) due to HTTP retry loops, the server validates event UUIDs:

1. **Redis Cache Check:** The API Gateway checks if the UUID exists in Redis: `EXISTS event:sync:{eventId}`. If found, it returns the cached HTTP 200 response immediately.
2. **PostgreSQL Constraint:** A unique key constraint ensures that two threads cannot insert the same event simultaneously:
   ```sql
   ALTER TABLE central_sales_events ADD CONSTRAINT unique_event_uuid UNIQUE (event_id);
   ```

---

# Related Documents

- **ARCHITECTURE.md** — General system architecture.
- **SECURITY.md** — Authentication and security architecture.
- **CONFLICT_RESOLUTION.md** — Business conflict resolution.
- **TEST.md** — Unit testing strategy and automation.
- **DESIGNDECISIONS.md** — Design decisions and technology choices.
- **DEPLOYMENT.md** — Deployment and operations strategy.
- **RUNNING.md** — Project execution guide.
