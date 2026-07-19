# 🚀 Local Execution Guide

## Case Study 2: Connectivity Strategies in Distributed Systems

---

# Prerequisites

Ensure you have installed:
- **Node.js** (v18 or v20) and npm.
- **Docker Desktop** for running infrastructure images.
- **Flutter SDK** for compiling Windows and Android apps.
- **Angular CLI** (`npm install -g @angular/cli`).

---

# 1. Starting Infrastructure Services (Docker)

Start the shared infrastructure services (PostgreSQL, Redis, RabbitMQ):

```bash
docker-compose up -d
```

---

# 2. Running Microservices (NestJS)

Install dependencies and start development servers:

```bash
cd backend
npm install
npm run start:dev api-gateway
npm run start:dev auth-service
npm run start:dev sync-service
npm run start:dev monitoring-service
npm run start:dev notification-service
```

---

# 3. Running Frontend Clients

### Admin Dashboard (Angular)
```bash
cd client-admin
npm install
ng serve --open
```

### POS Desktop Client (Flutter Windows)
```bash
cd client-pos
flutter pub get
flutter run -d windows
```

### Logistics Mobile Client (Flutter Android)
```bash
cd client-logistics
flutter pub get
flutter run -d android
```

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
