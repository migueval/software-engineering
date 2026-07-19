# 🏛️ Technical Architecture

## Case Study 2: Connectivity Strategies in Distributed Systems

---

# Architecture Overview

The system is designed as a combination of NestJS microservices in the backend and various frontend clients selected to meet specific business needs.

```mermaid
flowchart TB
    subgraph Frontend Clients
        ANGULAR[Admin Panel\nAngular SPA]
        FLUTTER_WIN[POS Desktop\nFlutter Windows / SQLite]
        FLUTTER_AND[Logistics App\nFlutter Android]
    end

    subgraph API Gateway Layer
        GW[API Gateway\nNestJS]
    end

    subgraph Backend Microservices
        AUTH[Auth Service\nJWT & RBAC]
        USER[User Service\nAdmin-Only Auth]
        SYNC[Sync Service\nEvent-Sourcing Conciliator]
        REPORT[Report Service\nWebSockets / Real-Time]
        NOTIF[Notification Service\nRabbitMQ Consumer]
    end

    subgraph Infrastructure
        PG[(PostgreSQL)]
        REDIS[(Redis\nTTL & Heartbeats)]
        MQ[(RabbitMQ)]
    end

    %% Client Communication
    ANGULAR -->|HTTP / WebSockets| GW
    FLUTTER_WIN -->|HTTP / Heartbeats| GW
    FLUTTER_AND -->|HTTP / REST| GW

    %% Gateway to Microservices
    GW -->|gRPC / HTTP| AUTH
    GW -->|gRPC / HTTP| USER
    GW -->|gRPC / HTTP| SYNC
    GW -->|gRPC / HTTP| REPORT

    %% Microservices to Storage / Messaging
    USER --> PG
    AUTH --> REDIS
    SYNC --> PG
    REPORT --> REDIS
    
    %% Async Notifications
    USER -->|Publish user.created| MQ
    MQ --> NOTIF
```

---

# Key Workflows & Sequences

## 1. Admin-Only User Creation

An administrator registers a new user. The temporary password is generated securely in the backend and dispatched asynchronously via RabbitMQ to the notification service.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrator
    participant GW as API Gateway
    participant US as User Service
    participant DB as PostgreSQL
    participant MQ as RabbitMQ
    participant NS as Notification Service
    actor User as Employee

    Admin->>GW: POST /api/users { email, name, role } [Token: Admin JWT]
    GW->>US: Create User Request
    US->>US: Generate Temporary Password (12 char random)
    US->>US: Hash Password (bcrypt)
    US->>DB: Save User (status: PENDING_FIRST_LOGIN)
    US->>MQ: Publish "user.created" { email, username, tempPassword }
    US-->>GW: User Created (Success)
    GW-->>Admin: HTTP 201 Created
    
    Note over MQ, NS: Asynchronous Processing
    MQ->>NS: Consume "user.created" Event
    NS->>User: Send Email with credentials
```

## 2. First Login & Password Change

The user logs in with the temporary password and is prompted to change it. Final Access/Refresh tokens are not generated until this step is complete.

```mermaid
sequenceDiagram
    autonumber
    actor User as Employee
    participant Client as Client Application
    participant GW as API Gateway
    participant AS as Auth Service
    participant DB as PostgreSQL

    User->>Client: Enters temp password
    Client->>GW: POST /api/auth/login { username, password }
    GW->>AS: Authenticate credentials
    AS->>DB: Check user and verify hash
    DB-->>AS: Valid Credentials (Status: PENDING_FIRST_LOGIN)
    AS->>AS: Generate stepToken (10m TTL)
    AS-->>GW: Return status: PASSWORD_CHANGE_REQUIRED + stepToken
    GW-->>Client: HTTP 200 { status: "PASSWORD_CHANGE_REQUIRED", stepToken: "step..." }
    
    Note over Client: Lock screen, show "Set New Password" form
    
    User->>Client: Enters new password
    Client->>GW: POST /api/auth/change-password { stepToken, newPassword }
    GW->>AS: Change Password Request
    AS->>DB: Validate stepToken in Redis
    AS->>AS: bcrypt.hash(newPassword)
    AS->>DB: Update password and set status to ACTIVE
    DB-->>AS: Success
    AS->>AS: Generate Access (15m) & Refresh Token (7d)
    AS-->>GW: Return JWTs
    GW-->>Client: HTTP 200 { accessToken, refreshToken, status: "ACTIVE" }
```

---

# Heartbeat Protocol (Real-Time Connectivity)

Each POS sends periodic heartbeats to update its status in Redis. If a heartbeat is missed, the monitoring service pushes a state change event to the Admin Dashboard via WebSockets.

```mermaid
flowchart LR
    POS[POS Client\nFlutter Windows]
    GW[API Gateway\nWebSockets / SSE]
    REDIS[(Redis\nStatus Store)]
    ADMIN[Admin Panel\nAngular SPA]

    POS -->|1. HTTP POST every 10s| GW
    GW -->|2. Update Status\nSETEX pos:101 15 'ONLINE'| REDIS
    REDIS -.->|3. TTL expires (15s)| REDIS
    GW2[Gateway Monitor] -->|4. Redis Pub-Sub| REDIS
    GW2 -->|5. WebSocket event| ADMIN
```

---

# Related Documents

- **SECURITY.md** — Authentication and security architecture.
- **SYNCHRONIZATION.md** — Event synchronization between clients and server.
- **CONFLICT_RESOLUTION.md** — Business conflict resolution.
- **TEST.md** — Unit testing strategy and automation.
- **DESIGNDECISIONS.md** — Design decisions and technology choices.
- **DEPLOYMENT.md** — Deployment and operations strategy.
- **RUNNING.md** — Project execution guide.
