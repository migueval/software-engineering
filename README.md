# 🛠️ Software Engineering Portfolio

A curated collection of architectural patterns, system design studies, and backend engineering implementations demonstrating clean code, scalability, and modern software practices.

---

## 🏛️ Featured Projects

| Project | Architecture | Tech Stack | Description |
| :--- | :--- | :--- | :--- |
| [🔐 Authentication Case Study](./authentication-architecture-case-study) | Monolith vs. Microservices | `NestJS`, `Angular`, `RabbitMQ`, `Redis`, `PostgreSQL` | Comparative study of a secure authentication system (JWT, 2FA/OTP, RBAC) implemented as both a single monolithic application and a distributed microservices monorepo. |

---

## 📚 Core Topics & Knowledge Areas

### 🏛️ Architecture & System Design
- **Monolithic Architecture:** Simple deployment, atomic transactions, shared state.
- **Microservices Monorepo:** Decoupled domains, API Gateway routing, TCP RPC communication.
- **Event-Driven Architecture (EDA):** Asynchronous message broadcasting via RabbitMQ.
- **Caching & Ephemeral Storage:** Fast temporary key-value storage and OTP validation using Redis.

### ⚙️ Backend Engineering
- **NestJS Modules & Dependency Injection:** Modular service structures and dependency lifecycles.
- **TypeORM & PostgreSQL:** Object-relational mapping, database transactions, migrations.
- **Queue & Async Processing:** Reliable message consumption, retries, and decoupled email processing.

### 🛡️ Cybersecurity & Identity
- **Two-Factor Authentication (2FA):** Cryptographically secure OTP generation, secure verification, and expiration control.
- **JWT Session Management:** Stateful refresh tokens and stateless access tokens.
- **Role-Based Access Control (RBAC):** Restricting route and controller resources based on custom user roles.

### 🎨 Frontend Engineering
- **Angular SPA:** Standalone component state, global services, reactive signals.
- **AuthGuards & Route Protection:** Clientside route security and automated redirection.
- **Dynamic Localization (i18n):** Real-time language switching (ES/EN) propagated to emails.

---

## 🚀 How to Run the Projects

Each project has its own detailed setup guides. 
1. Navigate to the project folder (e.g., `cd authentication-architecture-case-study`).
2. Follow the setup and running instructions in the project's `RUNNING.md` guide.

---

## 👨‍💻 Author

**Miguel Antonio Valdez Solis**  
*Software Engineer | Full Stack Developer*  
*Specialized in building scalable, resilient web and mobile architectures.*
