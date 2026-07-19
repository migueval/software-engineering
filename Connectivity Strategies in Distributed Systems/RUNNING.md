# 🚀 Guía de Ejecución Local

## Caso de Estudio 2: Estrategias de Conectividad en Sistemas Distribuidos

---

# Requisitos Previos

Antes de ejecutar las aplicaciones, asegúrate de tener instalado en tu equipo de desarrollo:
- **Node.js** (v18 o v20 recomendado) y npm.
- **Docker Desktop** para levantar la infraestructura compartida.
- **Flutter SDK** (v3.10 o superior) configurado para escritorio Windows y móvil Android.
- **Angular CLI** (`npm install -g @angular/cli`).

---

# 1. Levantar Infraestructura con Docker

El sistema requiere tres contenedores compartidos en red local: PostgreSQL (base de datos relacional central), Redis (sesiones, TTL y Heartbeats) y RabbitMQ (desacoplamiento de alertas y notificaciones).

Crea un archivo `docker-compose.yml` en la raíz del backend con la siguiente configuración:

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
      - "15672:15672" # Panel de administración de RabbitMQ

volumes:
  pgdata:
```

Ejecuta el siguiente comando en tu terminal para iniciar los servicios en segundo plano:
```bash
docker-compose up -d
```

---

# 2. Configurar y Ejecutar el Backend (Microservicios NestJS)

Navega a la carpeta del backend, instala dependencias e inicia los servicios:

```bash
cd backend
npm install
```

### Variables de Entorno (`.env`)
Asegúrate de crear un archivo `.env` en cada microservicio con las credenciales de conexión correspondientes:
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

### Ejecutar Servicios en Desarrollo
Inicia cada servicio usando su respectivo script de npm:
```bash
# Ejecutar API Gateway (Puerto 3000 por defecto)
npm run start:dev api-gateway

# Ejecutar el resto de servicios correspondientes
npm run start:dev auth-service
npm run start:dev sync-service
npm run start:dev monitoring-service
npm run start:dev notification-service
```

---

# 3. Ejecutar Aplicaciones Frontend (Clientes)

## A. Panel de Administración (Angular)
El panel administrativo requiere conectividad con el API Gateway y el servidor de WebSockets.

```bash
cd client-admin
npm install
ng serve --open
```
El panel se abrirá automáticamente en `http://localhost:4200/`.

## B. Punto de Venta Desktop (Flutter Windows)
Para compilar y ejecutar el Punto de Venta en modo nativo de Windows:

```bash
cd client-pos
flutter pub get
flutter run -d windows
```
*Nota: Al ejecutarse por primera vez, el cliente generará el archivo de base de datos SQLite local de manera automática.*

## C. App de Logística (Flutter Android)
Para compilar y desplegar la app en un emulador o dispositivo Android conectado:

```bash
cd client-logistics
flutter pub get
flutter run -d android
```

---

# 4. Simulación de Escenarios del Caso de Estudio

Una vez que todo el entorno esté en funcionamiento, puedes simular los siguientes comportamientos:

### Simular Caja Fuera de Red (Offline Mode)
1. Desconecta el cable de red o apaga el Wi-Fi de la computadora donde corre el **POS Desktop**.
2. Registra ventas en el POS. Observa que el sistema permite realizar cobros instantáneamente sin latencia y los almacena localmente en SQLite.
3. Observa que en el **Panel de Angular Admin**, el estado del POS cambia automáticamente a **"OFFLINE"** tras 15 segundos sin recibir latidos.
4. Vuelve a conectar la red. Observa cómo el motor de sincronización del POS detecta señal y sube las ventas diferidas de forma asíncrona mediante lotes.
5. El stock se actualiza en PostgreSQL centralizado y la alerta de desconexión en Angular desaparece automáticamente.

---

# Documentos Relacionados

- **ARCHITECTURE.md** — Arquitectura general del sistema.
- **SECURITY.md** — Autenticación, autorización y seguridad offline.
- **SYNCHRONIZATION.md** — Sincronización de eventos entre clientes y servidor.
- **CONFLICT_RESOLUTION.md** — Resolución de conflictos de negocio.
- **TEST.md** — Estrategia de pruebas unitarias y automatización.
- **DESIGNDECISIONS.md** — Decisiones de diseño y elecciones tecnológicas.
- **DEPLOYMENT.md** — Estrategia de despliegue y operación.
- **RUNNING.md** — Ejecución del proyecto.
