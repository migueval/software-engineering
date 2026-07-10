# Running the Project

## Navigation

- 🏠 [README.md](./README.md)
- 🏛️ [ARCHITECTURE.md](./ARCHITECTURE.md)

---

# Requirements

Make sure you have the following installed on your machine:

- **Node.js**: v20.x or higher
- **NPM**: v10.x or higher (or PNPM / Yarn)
- **Docker**: Desktop or Engine
- **Docker Compose**: CLI plugin

---

# Start Infrastructure

All third-party services (databases, cache, broker) are containerized. Spin them up from the root folder:

```bash
docker compose up -d
```

To stop the containers and keep the data:
```bash
docker compose down
```

To stop the containers and wipe database volumes:
```bash
docker compose down -v
```

---

# Run Monolith Backend

1. Navigate to the monolith directory:
   ```bash
   cd nestjs-monolith
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the NestJS application in development mode:
   ```bash
   npm run start:dev
   ```

---

# Run Microservices Backend

1. Navigate to the microservices monorepo directory:
   ```bash
   cd nestjs-microservices
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run all four microservices concurrently using a single command:
   ```bash
   npm run start:all
   ```
   *Or you can run individual microservices in separate terminal tabs if you prefer:*
   * **API Gateway:** `npm run start:dev:gateway`
   * **User Service:** `npm run start:dev:users`
   * **Auth Service:** `npm run start:dev:auth`
   * **Notification Service:** `npm run start:dev:notifications`

---

# Run Angular Client

1. Navigate to the frontend client directory:
   ```bash
   cd angular-client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Angular application:
   ```bash
   npm start
   ```

---

# Local Endpoints & Ports

When running locally, you can access the applications and infrastructure services using the following ports:

### Application Services
* **Angular Frontend Client**: [http://localhost:4200](http://localhost:4200)
* **Monolith API Server**: [http://localhost:3000](http://localhost:3000)
* **Microservices API Gateway**: [http://localhost:3001](http://localhost:3001)

### Infrastructure Containers (Docker Compose)
* **PostgreSQL Database** (`5432`): Connection string `postgresql://postgres:postgres@localhost:5432/auth_case_study`
* **Redis Cache** (`6379`): Connection host `localhost:6379`
* **RabbitMQ Broker** (`5672`): AMQP URI `amqp://guest:guest@localhost:5672`
* **RabbitMQ Management Dashboard**: [http://localhost:15672](http://localhost:15672) (User: `guest` | Password: `guest`)

---

# Additional Information

For system design diagrams, security models, failure isolation analysis, and design decisions:

- 🏠 [README.md](./README.md)
- 🏛️ [ARCHITECTURE.md](./ARCHITECTURE.md)
- ⚙️ [DESIGNDECISIONS.md](./DESIGNDECISIONS.md)
