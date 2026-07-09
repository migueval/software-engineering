# Running the Project

## Navigation

- 🏠 ./README.md
- 🏛️ ./ARCHITECTURE.md

---

# Prerequisites

Required software:

- Node.js 20+
- Docker
- Docker Compose

Verify installation:

```bash
node -v
docker -v
docker compose version
```

---

# Repository Structure

```text
authentication-architecture-case-study/

├── angular-client/
├── nestjs-monolith/
└── nestjs-microservices/
```

---

# Infrastructure Setup

The following infrastructure is shared by both implementations:

| Service | Purpose |
|----------|----------|
| PostgreSQL | Persistent storage |
| Redis | OTP and session storage |
| RabbitMQ | Event messaging |

Start infrastructure:

```bash
docker compose up -d
```

Verify containers:

```bash
docker ps
```

---

# Environment Variables

Create a `.env` file in each project.

Example:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/authdb

JWT_SECRET=super-secret-key

REDIS_HOST=localhost
REDIS_PORT=6379

RABBITMQ_URL=amqp://localhost:5672
```

---

# Running the Monolith

Navigate to:

```bash
cd nestjs-monolith
```

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run start:dev
```

Default URL:

```text
http://localhost:3000
```

---

# Running the Microservices Version

Navigate to:

```bash
cd nestjs-microservices
```

Install dependencies:

```bash
npm install
```

Run services:

```bash
npm run start:dev
```

This starts:

- API Gateway
- Auth Service
- User Service
- OTP Service
- Notification Service

Default Gateway URL:

```text
http://localhost:3001
```

---

# Running Angular

Navigate to:

```bash
cd angular-client
```

Install dependencies:

```bash
npm install
```

Start Angular:

```bash
npm start
```

Frontend URL:

```text
http://localhost:4200
```

---

# Local Endpoints

## Frontend

```text
http://localhost:4200
```

## Monolith

```text
http://localhost:3000
```

## API Gateway

```text
http://localhost:3001
```

## PostgreSQL

```text
localhost:5432
```

## Redis

```text
localhost:6379
```

## RabbitMQ

```text
localhost:5672
```

Management UI:

```text
http://localhost:15672
```

---

# Development Workflow

1. Start Docker infrastructure.
2. Run Monolith or Microservices implementation.
3. Run Angular client.
4. Register a user.
5. Authenticate using credentials.
6. Verify OTP.
7. Access protected routes.

---

# Troubleshooting

## Container Not Starting

```bash
docker compose down
docker compose up -d
```

## Dependency Issues

```bash
rm -rf node_modules
npm install
```

## Verify Logs

```bash
docker logs container-name
```

---

# Additional Documentation

- 🏠 ./README.md
- 🏛️ ./ARCHITECTURE.md
