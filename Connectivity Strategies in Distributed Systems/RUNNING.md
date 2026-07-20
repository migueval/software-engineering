# 🚀 Local Execution Guide

## Case Study 2: Connectivity Strategies in Distributed Systems

---

# Prerequisites

Before running the applications, make sure you have the following installed on your development machine:
- **Node.js** (v18 or v20 recommended) and npm.
- **Docker Desktop** to spin up shared infrastructure.
- **Flutter SDK** (v3.10 or higher) configured for Windows desktop and Android mobile.
- **Angular CLI** (`npm install -g @angular/cli`).

---

# 1. Spin Up Infrastructure with Docker

The system requires three containers shared over local network: PostgreSQL (central relational database), Redis (sessions, TTL, and Heartbeats), and RabbitMQ (alerts and notifications decoupling).

Create a `docker-compose.yml` file at the root of the backend with the following configuration:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: case_study_postgres
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: SecretPassword123
      POSTGRES_DB: corporate_central_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: case_study_redis
    ports:
      - "6379:6379"

  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: case_study_rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672" # RabbitMQ Management Console

volumes:
  pgdata:
```

Run the following command in your terminal to start background services:
```bash
docker-compose up -d
```

---

# 2. Configure and Run Backend (NestJS Microservices)

Navigate to the backend folder, install dependencies, and start services:

```bash
cd backend
npm install
```

### Environment Variables (`.env`)
Make sure to create a `.env` file in each microservice with corresponding connection credentials:
```env
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=admin
DATABASE_PASSWORD=SecretPassword123
DATABASE_NAME=corporate_central_db
REDIS_HOST=localhost
REDIS_PORT=6379
RABBITMQ_URI=amqp://localhost:5672
JWT_SECRET=super_secret_corporate_key
```

### Run Services in Development Mode
Start each service using its respective npm script:
```bash
# Run API Gateway (Default Port 3000)
npm run start:dev api-gateway

# Run remaining corresponding services
npm run start:dev auth-service
npm run start:dev sync-service
npm run start:dev monitoring-service
npm run start:dev notification-service
```

---

# 3. Run Frontend Applications (Clients)

## A. Administration Panel (Angular)
The administrative panel requires connectivity with the API Gateway and WebSockets server.

```bash
cd client-admin
npm install
ng serve --open
```
The panel will open automatically at `http://localhost:4200/`.

## B. Point of Sale Desktop (Flutter Windows)
To compile and run the Point of Sale in native Windows mode:

```bash
cd client-pos
flutter pub get
flutter run -d windows
```
*Note: On initial launch, the client will automatically generate the local SQLite database file.*

## C. Logistics App (Flutter Android)
To compile and deploy the app on a connected Android emulator or physical device:

```bash
cd client-logistics
flutter pub get
flutter run -d android
```

---

# 4. Simulation of Case Study Scenarios

Once the full environment is operational, you can simulate the following behaviors:

### Simulate POS Offline Mode
1. Disconnect the network cable or turn off Wi-Fi on the machine running **POS Desktop**.
2. Register sales on the POS. Observe that the system allows completing checkout transactions instantly without latency, storing them locally in SQLite.
3. Observe that in the **Angular Admin Panel**, POS status automatically changes to **"OFFLINE"** after 15 seconds without receiving heartbeats.
4. Reconnect the network. Observe how the POS sync engine detects connectivity and uploads deferred sales asynchronously in batches.
5. Inventory updates in central PostgreSQL, and the disconnection alert in Angular automatically disappears.

---

# Related Documents

- **ARCHITECTURE.md** — Overall system architecture.
- **SECURITY.md** — Authentication, authorization, and offline security.
- **SYNCHRONIZATION.md** — Event synchronization between clients and server.
- **CONFLICT_RESOLUTION.md** — Business conflict resolution.
- **TEST.md** — Unit testing strategy and automation.
- **DESIGNDECISIONS.md** — Design decisions and technology choices.
- **DEPLOYMENT.md** — Deployment and operational strategy.
- **RUNNING.md** — Project execution.
