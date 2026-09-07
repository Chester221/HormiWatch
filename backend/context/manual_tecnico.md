# Manual Técnico - HormiWatch

**Versión del Documento:** 1.0
**Fecha:** Enero 2026
**Tecnología:** NestJS + MySQL (TypeORM)

---

## 1. Introducción
**HormiWatch** es un sistema backend de gestión de tiempo y servicios profesionales (PSA), diseñado para administrar proyectos, tareas, técnicos y métricas de desempeño. Su arquitectura está orientada a la escalabilidad modular y la seguridad de datos.

## 2. Pila Tecnológica
*   **Framework:** NestJS v11 (Node.js)
*   **Lenguaje:** TypeScript
*   **Base de Datos:** MySQL
*   **ORM:** TypeORM
*   **Autenticación:** JWT + Argon2 (Hashing)
*   **API Specs:** OpenAPI 3.0 (Swagger)
*   **Integraciones:**
    *   Supabase Storage (Archivos)
    *   Google Calendar API (Feriados)
    *   Gmail / Nodemailer (Notificaciones)
    *   PDFMake (Reportes)

## 3. Arquitectura del Sistema
El proyecto sigue una **Arquitectura Modular** estándar de NestJS. Cada dominio de negocio tiene su propio módulo que encapsula controladores, servicios y entidades.

### 3.1. Estructura de Directorios
```
src/
├── app.module.ts           # Módulo raíz
├── main.ts                 # Punto de entrada (Setup de Swagger, Pipes, CORS)
├── common/                 # Decoradores, Filtros, Transformadores compartidos
├── config/                 # Configuración de variables de entorno
└── modules/
    ├── auth/               # Autenticación y JWT Strategy
    ├── users/              # Gestión de Usuarios y Perfiles
    ├── projects/           # Gestión de Proyectos
    ├── tasks/              # Gestión de Tareas y Tiempos
    ├── services/           # Catálogo jerárquico de servicios
    ├── metrics/            # Lógica de dashboard y KPIs
    ├── reports/            # Generación de PDFs
    └── audit/              # Trazabilidad de cambios
```

## 4. Base de Datos (Entity-Relationship)
El sistema utiliza un modelo relacional normalizado:
*   **User**: Entidad central (Técnicos, Managers, Admin).
*   **Project**: Contenedor de tareas, con presupuesto de horas (`poolHours`).
*   **Service**: Define el tipo de actividad (Categoría -> Plataforma -> Tipo).
*   **Task**: Unidad de trabajo. Relaciona `User`, `Project` y `Service`.
    *   *Nota*: Usa `Temporal.Instant` para precisión exacta de tiempos (UTC).

### Reglas Clave de DB
*   **Timezones**: La BD almacena fechas en UTC (o con ajuste EST controlado) para evitar inconsistencias horarias.
*   **Soft Delete**: La mayoría de entidades soportan borrado lógico (`deletedAt`).

## 5. Instalación y Despliegue

### Prerrequisitos
*   Node.js v18+
*   pnpm (Recomendado)
*   MySQL 8.0

### Pasos
1.  **Clonar repositorio y dependencias:**
    ```bash
    git clone <repo_url>
    cd backend
    pnpm install
    ```
2.  **Configurar Entorno (`.env`):**
    ```properties
    PORT=3000
    DB_HOST=localhost
    DB_PORT=3306
    DB_USER=root
    DB_PASSWORD=secret
    DB_NAME=hormiwatch
    JWT_SECRET=super_secret_key
    ```
3.  **Ejecutar Migraciones (si aplica) o Sincronizar:**
    *   *Desarrollo*: `synchronize: true` en TypeORM config.
    *   *Producción*: Usar sistema de migraciones.
4.  **Iniciar Servidor:**
    ```bash
    pnpm start:dev  # Desarrollo
    pnpm build && pnpm start:prod # Producción
    ```

## 6. Referencia de API (Endpoints)

A continuación se listan todos los endpoints disponibles en el sistema, agrupados por módulo.

### Auth (`/auth`)
*   `POST /auth/login`: Iniciar sesión y obtener JWT.
*   `POST /auth/logout`: Cerrar sesión inválida.
*   `POST /auth/refresh`: Refrescar el token de acceso usando el Refresh Token.

### Users (`/users`)
*   `POST /users`: Crear un nuevo usuario.
*   `GET /users`: Listar usuarios (Paginación + Filtros: `roleName`, `isActive`, `q`).
*   `GET /users/managers`: Listar usuarios con rol Manager.
*   `GET /users/technicians`: Listar usuarios con rol Technician.
*   `GET /users/{id}`: Obtener detalle de usuario.
*   `PATCH /users/{id}`: Actualizar usuario.
*   `DELETE /users/{id}`: Borrado lógico de usuario.
*   `PATCH /users/{id}/restore`: Restaurar usuario eliminado.

### Roles (`/role`)
*   `POST /role`: Crear rol.
*   `GET /role`: Listar todos los roles.
*   `GET /role/{id}`: Obtener rol por ID.
*   `PATCH /role/{id}`: Actualizar rol.
*   `DELETE /role/{id}`: Eliminar rol.

### Projects (`/projects`)
*   `POST /projects`: Crear proyecto (Requiere `projectLeaderId`).
*   `GET /projects`: Listar proyectos (Filtros: `status`, `leaderId`, `technicianId`).
*   `GET /projects/{id}`: Detalle de proyecto.
*   `PATCH /projects/{id}`: Actualizar proyecto (ej. cambiar status, `poolHours`).
*   `DELETE /projects/{id}`: Borrado lógico.
*   `PATCH /projects/{id}/restore`: Restaurar proyecto.

### Tasks (`/tasks`)
*   `POST /tasks`: Registrar nueva tarea (Time Entry).
*   `GET /tasks`: Listar tareas (Filtros: `technicianId`, `projectId`, `startDateTime`, `endDateTime`).
*   `GET /tasks/statuses`: Listar estados posibles (`PENDING`, `IN_PROGRESS`, etc).
*   `PUT /tasks/{id}`: Actualizar tarea (Recálculo automático de pool).
*   `DELETE /tasks/{id}`: Eliminar tarea (Restaura horas al pool).

### Services (`/services`)
*   **Categorías** (`/services/categories`):
    *   `GET /`, `POST /`, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}`
*   **Plataformas** (`/services/platforms`):
    *   `GET /`, `POST /`, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}`
*   **Tipos** (`/services/types`):
    *   `GET /`, `POST /`, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}`
*   **Servicios Finales** (`/services`):
    *   `GET /`: Listar servicios (Filtros por `category`, `platform`, `type`).
    *   `POST /`, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}`.

### Holidays (`/holidays`)
*   `POST /holidays`: Crear feriado manual.
*   `GET /holidays`: Listar feriados.
*   `PUT /holidays/{id}`, `DELETE /holidays/{id}`.
*   `POST /holidays/sync`: Sincronizar automáticamente con Google Calendar.

### Customers (`/customers`)
*   `POST /customers`: Crear cliente.
*   `GET /customers`: Listar clientes (Búsqueda por nombre).
*   `GET /customers/dashboard`: Métricas simples (Total clientes/contactos).
*   `GET /customers/{id}`, `PATCH /customers/{id}`, `DELETE /customers/{id}`.
*   **Contactos** (`/customers/{customerId}/contacts`):
    *   `POST /`, `GET /`, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}`.

### Reports (`/reports`)
*   `GET /reports/{id}/pdf`: Reporte General del Proyecto (PDF).
*   `GET /reports/{id}/pdf-usuarios`: Reporte detallado por usuarios (PDF).
*   `GET /reports/{id}/pdf-grafico`: Reporte visual con gráficos (PDF).

### Metrics (`/metrics`)
*   `GET /metrics/recent-projects`: Proyectos recientes con métricas.
*   `GET /metrics/completed-projects/{userId}`: Conteo de proyectos cerrados por usuario.
*   `GET /metrics/project/{projectId}`: Métricas específicas de un proyecto.
*   `GET /metrics/registered-tasks/{userId}`: Total de tareas registradas.
*   `GET /metrics/total-task-time/{userId}`: Tiempo total imputado.
*   `GET /metrics/tasks-by-technician-project/{projectId}`: Desglose de horas por técnico en un proyecto.

### Audit (`/audit`)
*   `POST /audit`: (Uso interno) Crear log.
*   `GET /audit`: Ver historial de cambios.
*   `GET /audit/{id}`, `PATCH /audit/{id}`, `DELETE /audit/{id}`.

### Notifications (`/notifications`)
*   `POST /notifications`: Configurar preferencias.
*   `GET /notifications`: Ver preferencias.
*   `GET /notifications/{id}`, `PATCH /notifications/{id}`, `DELETE /notifications/{id}`.

### Mails (`/mails`)
*   `POST /mails/send`: Envío manual de correos transaccionales.

## 7. Manejo de Errores
El sistema implementa filtros globales (`QueryFailedFilter`) para capturar errores de base de datos (como duplicados) y retornarlos como excepciones HTTP limpias (409 Conflict, 400 Bad Request), protegiendo la estructura interna.
