# Architecture & Design Decisions

## Navigation

- 🏠 ./README.md
- ⚙️ ./DESIGNDECISIONS.md
- 🚀 ./RUNNING.md

---

# Architecture Overview

This repository demonstrates the implementation of the same authentication requirements using two different architectural approaches.

## Business Requirements

Both implementations must support:

- User Registration
- User Authentication
- JWT Authentication
- Refresh Tokens
- Two-Factor Authentication (OTP)
- Role-Based Access Control (RBAC)
- Angular AuthGuards
- Protected Routes
- Session Management

The goal is to compare implementation trade-offs while maintaining identical functionality.

---

# High-Level Architecture

```mermaid
flowchart TB

    subgraph Frontend
        ANGULAR[Angular SPA]
    end

    subgraph Monolith
        MONO[NestJS Monolith]
        PG1[(PostgreSQL)]
    end

    subgraph Microservices
        GW[API Gateway]
        AUTH[Auth Service]
        USER[User Service]
        OTP[OTP Service]
        NOTIF[Notification Service]

        REDIS[(Redis)]
        MQ[(RabbitMQ)]
        PG2[(PostgreSQL)]
    end

    ANGULAR --> MONO
    MONO --> PG1

    ANGULAR --> GW

    GW --> AUTH
    AUTH --> USER
    AUTH --> OTP

    USER --> PG2
    OTP --> REDIS

    AUTH --> MQ
    MQ --> NOTIF
```

---

# Monolithic Architecture

## Overview

The monolithic implementation executes all business capabilities inside a single NestJS application.

```mermaid
flowchart LR

CLIENT[Angular Client]

subgraph Monolith

AUTH[Auth Module]
USER[Users Module]
OTP[OTP Module]
MAIL[Notification Module]

end

DB[(PostgreSQL)]

CLIENT --> AUTH

AUTH --> USER
AUTH --> OTP
AUTH --> MAIL

USER --> DB
OTP --> DB
```

## Components

### Auth Module

Responsible for:

- Login
- JWT Generation
- Refresh Tokens
- Session Management

### Users Module

Responsible for:

- User Registration
- Credential Storage
- User Roles

### OTP Module

Responsible for:

- OTP Generation
- OTP Validation
- Expiration Control

### Mail Module

Responsible for:

- Email Notifications
- OTP Delivery

---

## Advantages

- Simple deployment
- Easier debugging
- Lower infrastructure costs
- ACID transactions
- Faster development cycles

---

## Challenges

- Tight coupling between modules
- Shared deployment lifecycle
- Lower fault isolation
- Limited independent scalability

---

# Microservices Architecture

## Overview

The microservice implementation separates responsibilities into independent deployable services.

```mermaid
flowchart LR

CLIENT[Angular App]

GW[API Gateway]

AUTH[Auth Service]
USER[User Service]
OTP[OTP Service]
NOTIF[Notification Service]

REDIS[(Redis)]
PG[(PostgreSQL)]
MQ[(RabbitMQ)]

CLIENT --> GW

GW --> AUTH

AUTH --> USER
AUTH --> OTP

USER --> PG

OTP --> REDIS

AUTH --> MQ
MQ --> NOTIF
```

---

## API Gateway

Responsibilities:

- HTTP Entry Point
- Request Routing
- Authentication Validation
- Authorization Middleware

---

## User Service

Responsibilities:

- User Registration
- User Retrieval
- Roles and Permissions
- Credential Management

Storage:

- PostgreSQL

---

## Auth Service

Responsibilities:

- Login Validation
- JWT Generation
- Refresh Tokens
- Session Validation

---

## OTP Service

Responsibilities:

- OTP Generation
- OTP Validation
- TTL Control

Storage:

- Redis

---

## Notification Service

Responsibilities:

- Email Delivery
- Event Consumption
- Welcome Emails
- OTP Notifications

---

## RabbitMQ

Responsibilities:

- Event Distribution
- Asynchronous Communication
- Retry Mechanisms
- Decoupling Services

---

# API Contract

## Register User

### Request

```http
POST /api/auth/register
```

```json
{
  "name": "Miguel Valdez",
  "email": "developer@example.com",
  "password": "SecurePassword123",
  "role": "admin",
  "lang": "es"
}
```

> **Note:** `lang` is an optional string (accepts `"es"` or `"en"`, default is `"es"`) denoting the preferred communication language for automatic email templates.

### Response

```json
{
  "status": "SUCCESS",
  "message": "User successfully registered."
}
```

---

## Login

### Request

```http
POST /api/auth/login
```

```json
{
  "email": "developer@example.com",
  "password": "SecurePassword123",
  "lang": "es"
}
```

> **Note:** `lang` is an optional string (accepts `"es"` or `"en"`, default is `"es"`) used to specify the language for the generated OTP verification email templates.

### Response

```json
{
  "status": "OTP_REQUIRED",
  "stepToken": "uuid-value"
}
```

---

## Verify OTP

### Request

```http
POST /api/auth/verify-otp
```

```json
{
  "stepToken": "uuid-value",
  "code": "123456"
}
```

### Response

```json
{
  "status": "SUCCESS",
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

---

# Registration Flow

```mermaid
sequenceDiagram

autonumber

actor User
participant Angular
participant Gateway
participant UserService
participant PostgreSQL
participant RabbitMQ
participant Notification

User->>Angular: Register

Angular->>Gateway: POST /register

Gateway->>UserService: Register User

UserService->>UserService: bcrypt.hash()

UserService->>PostgreSQL: Save User

PostgreSQL-->>UserService: Created

UserService->>RabbitMQ: user.registered

RabbitMQ->>Notification: Consume Event

Notification->>User: Welcome Email
```

---

# Authentication Flow

```mermaid
sequenceDiagram

autonumber

actor User
participant Angular
participant Gateway
participant Auth
participant OTP
participant Redis
participant Notification

User->>Angular: Login

Angular->>Gateway: Credentials

Gateway->>Auth: Authenticate

Auth->>OTP: Generate OTP

OTP->>Redis: Store OTP

OTP-->>Auth: stepToken

Auth->>Notification: Send OTP

Auth-->>Angular: OTP_REQUIRED

User->>Angular: Submit OTP

Angular->>Gateway: Verify OTP

Gateway->>Auth: Verify

Auth->>Redis: Validate

Redis-->>Auth: Valid

Auth-->>Angular: JWT + Refresh Token
```

---

# Failure Isolation

## Monolith

```text
Notification Failure
        ↓
Authentication Impact
```

## Microservices

```text
Notification Failure
        ↓
RabbitMQ Queues Events
        ↓
Authentication Continues Working
```

---

# Security Model

## Password Protection

- **Hashing:** Secure one-way hashing using `bcrypt` with 10 salt rounds.
- **Complexity Policy (Enforced at DTO layer via regex):**
  - Minimum **8 characters** in length.
  - At least **one uppercase letter** (`A-Z`).
  - At least **one lowercase letter** (`a-z`).
  - At least **one numerical digit** (`0-9`).
  - At least **one special character or symbol** (e.g. `@`, `$`, `!`, `%`, `*`, `?`, `&`, `_`).
- **Zero Plaintext Leakage:** Raw passwords are encrypted immediately upon receipt and are never saved or outputted to logs.

## Authentication

- **JWT Access Tokens:** Short-lived tokens (valid for 15 minutes) sent in the HTTP authorization headers as a Bearer token.
- **JWT Refresh Tokens:** Long-lived tokens (valid for 7 days) used to request new access tokens silently without prompting the user.
- **Stateful Invalidation:** Blacklisted refresh tokens are stored in the database/Redis upon logout to prevent replay attacks.

### Token Lifecycle Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (Browser)
    participant API as API Gateway / Monolith
    participant DB as PostgreSQL / Redis

    Note over User, API: 1. Initial Login & OTP Phase
    User->>API: POST /auth/login (credentials)
    API->>DB: Check User & Generate OTP
    DB-->>API: OTP Saved (180s TTL)
    API-->>User: HTTP 200 { stepToken } (Requires OTP)
    User->>API: POST /auth/verify-otp { code, stepToken }
    API->>DB: Validate OTP code & stepToken
    DB-->>API: Valid OTP (used = true)
    API->>API: Sign AccessToken (15m) & RefreshToken (7d)
    API-->>User: HTTP 200 { AccessToken, RefreshToken }

    Note over User, API: 2. Normal Operations
    User->>API: GET /auth/profile [Authorization: Bearer AccessToken]
    API->>API: Validate AccessToken signature & expiration
    API-->>User: HTTP 200 { profileData }

    Note over User, API: 3. Token Expiration & Refresh Flow
    Note over User: AccessToken expires (after 15 minutes)
    User->>API: GET /auth/profile [Authorization: Bearer AccessToken]
    API->>API: Expired AccessToken detected
    API-->>User: HTTP 401 Unauthorized
    
    Note over User: Client interceptor catches 401
    User->>API: POST /auth/refresh { RefreshToken }
    API->>DB: Verify RefreshToken expiration/blacklist status
    DB-->>API: RefreshToken is Valid
    API->>API: Sign NEW AccessToken (15m)
    API-->>User: HTTP 200 { AccessToken }
    
    Note over User: Client retries original request
    User->>API: GET /auth/profile [Authorization: Bearer NEW AccessToken]
    API-->>User: HTTP 200 { profileData }

    Note over User: RefreshToken expires or is invalidated (logout)
    User->>API: POST /auth/logout { RefreshToken }
    API->>DB: Blacklist RefreshToken
    API-->>User: HTTP 200 (Session Terminated)
```

## OTP

- 6-digit code
- Cryptographically secure generation
- TTL expiration (180 seconds)

## Authorization

- RBAC
- Angular AuthGuards
- Endpoint Protection

## Rate Limiting & Brute-Force Mitigation

To prevent automated scripts and brute-force attacks, we implement rate limiting using `@nestjs/throttler`:

- **Global Limit:** Maximum of 60 requests per minute by default.
- **Login Throttling (`POST /api/auth/login`):** Throttled to 5 requests per minute.
- **OTP Verification Throttling (`POST /api/auth/verify-otp`):** Throttled to 3 requests per 3 minutes (180 seconds).

### Throttled Response (HTTP 429)

If a user exceeds the request limits, the server rejects the request with a `429 Too Many Requests` status code:

```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

---

# Scalability Considerations

## Monolith

Scaling method:

- Vertical Scaling
- Replicated Instances

Challenges:

- Entire application scales together

---

## Microservices

Scaling method:

- Service-by-service scaling

Example:

Authentication traffic increases:

✅ Scale Auth Service

✅ Scale Redis

✅ Keep Notification unchanged

---

# Architectural Decisions

## Why NestJS?

- Modular architecture
- Dependency Injection
- Microservice support

## Why PostgreSQL?

- Strong consistency
- ACID transactions

## Why Redis?

- High-performance temporary storage
- Native TTL support

## Why RabbitMQ?

- Reliable asynchronous communication
- Service decoupling

## Why JWT?

- Stateless authentication
- Suitable for distributed environments

---

# Lessons Learned

## Monolith

Ideal for:

- MVPs
- Small teams
- Fast delivery

## Microservices

Ideal for:

- Large systems
- Independent scaling
- High availability
- Team autonomy

No architecture is universally superior. The correct approach depends on business requirements and operational constraints.

---

# Testing Strategy

To ensure database operations, encryption, token signing, and OTP logic behave reliably without regressions, the core authentication service is protected by automated tests.

## Monolith Test Suite

Unit tests are written with **Jest** and can be run locally:

```bash
npm run test
```

The test coverage covers the following behaviors in [auth.service.spec.ts](file:///c:/Users/migue/OneDrive/Documents/idisoluciones/monolitovsmicroservicio/nestjs-monolith/src/auth/auth.service.spec.ts):
- **User Registration:** Checks that user creation, password hashing, and welcome email dispatcher work correctly.
- **Authentication (Login):** Validates credential matching (invalid email, invalid password, correct login) and checks that numeric OTP generation and storage function correctly.
- **OTP Verification:** Tests edge cases such as invalid stepToken lookup, expired OTP limits, incorrect OTP codes, and successful verification (which marks the OTP as used and signs the final JWT access token).

---

# Related Documentation

- 🏠 ./README.md
- 🚀 ./RUNNING.md