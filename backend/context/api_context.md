# Contexto de API (HormiWatch)

Resumen de los endpoints disponibles basado en la definición Swagger (OpenAPI 3.0).

## Auth (`/auth`)
- `POST /login`: Iniciar sesión.
- `POST /logout`: Cerrar sesión.
- `POST /refresh`: Refrescar access token.

## Users (`/users`)
- CRUD completo de usuarios.
- `GET /users`: Listado paginado con filtros (roleName, isActive, q, etc).
- `GET /managers`, `GET /technicians`: Endpoints específicos para listar roles.
- `PATCH /{id}/restore`: Restaurar usuario eliminado (Soft Delete).

## Roles (`/role`)
- CRUD de roles (Admin, Manager, Technician, Employee).

## Projects (`/projects`)
- CRUD de proyectos.
- Gestión de `poolHours` y asignación de `projectLeader` y `technicians`.
- `PATCH /{id}/restore`: Restaurar proyecto.

## Tasks (`/tasks`)
- CRUD de tareas (Registro de horas).
- Filtros potentes: `technicianId`, `projectId`, `status`, `startDateTime`, `endDateTime`.
- `GET /statuses`: (Recién arreglado, público) Lista estados posibles.

## Services (`/services`)
- Estructura jerárquica de servicios para imputación de horas.
- **Categories** (`/services/categories`): Categorías de servicio.
- **Platforms** (`/services/platforms`): Plataformas (Web, Mobile, etc).
- **Types** (`/services/types`): Tipos de servicio (Hourly, Fixed, etc).
- **Services** (`/services`): Entidad final vinculada a tareas.

## Holidays (`/holidays`)
- Gestión de días feriados.
- `POST /sync`: Sincronización con Google Calendar.

## Customers (`/customers`)
- CRM básico.
- Clientes y Contactos (`/customers/{customerId}/contacts`).
- `GET /dashboard`: Métricas de clientes.

## Reports (`/reports`)
- Generación de PDFs.
- `{id}/pdf`: Reporte general de proyecto.
- `{id}/pdf-usuarios`: Reporte por usuarios.
- `{id}/pdf-grafico`: Reporte con gráficos.

## Metrics (`/metrics`)
- Dashboard y analítica.
- `completed-projects`, `recent-projects`.
- `registered-tasks`, `total-task-time`.
- `tasks-by-technician-project`: Desglose detallado.

## Audit (`/audit`)
- Sistema de auditoría (Log de cambios).
- Registra `action`, `affectedEntity`, `oldValues`, `newValues`.

## Notifications (`/notifications`)
- Preferencias de notificación (Email, WhatsApp).

## Mails (`/mails`)
- `POST /send`: Envío manual de correos con plantillas.
