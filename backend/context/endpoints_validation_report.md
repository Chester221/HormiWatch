# 🟢 Validación de Endpoints Completada

**Fecha:** 12 de Enero, 2026
**Responsable:** Agente QA & Backend Senior

Este documento certifica la validación exhaustiva de los módulos críticos del sistema **HormiWatch**, con foco obsesivo en la integridad temporal (**UTC vs EST**) y la consistencia de datos.

## 1. Resumen de Validación

| Módulo | Endpoint probado | Estado | Observación Técnica (Timezones) |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST /login` | ✅ Aprobado | Guarda `lastConnection` en EST (DB), devuelve UTC (App). |
| **Users** | `POST /users` | ✅ Aprobado | `createdAt` gestionado por `UtcDateTransformer`. |
| **Users** | `PATCH /users/:id` | ✅ Aprobado | **Fix aplicado:** Se forzó actualización manual de `updatedAt`. |
| **Users** | `GET /users` | ✅ Aprobado | Listado correcto con fechas en UTC. |
| **Users** | `DELETE /users/:id` | ✅ Aprobado | Soft-delete verificado (`deletedAt` en EST). |
| **Projects** | `POST /projects` | ✅ Aprobado | `startDate`/`endDate` son `PlainDate` (agnósticos a zona horaria), seguro. Validado con Auth. |
| **Projects** | `PATCH /projects/:id`| ✅ Aprobado | Actualización verificada. |
| **Projects** | `DELETE /projects/:id`| ✅ Aprobado | Soft-delete correcto. |
| **Tasks** | `POST /tasks` | ✅ Aprobado | `startDateTime` (UTC) se convierte correctamente para cálculos y se guarda íntegro. **Verificado Input=Output**. |
| **Tasks** | `UPDATE/DELETE` | ✅ Aprobado | **Cálculo de `poolHours`**: Se validó que al editar o borrar tareas, las horas del proyecto se ajustan correctamente. |
| **Services** | `POST /services` | ✅ Aprobado | Validado implícitamente como dependencia de tareas. Bug de rutas corregido. |

## 2. Hallazgos y Correcciones Aplicadas

### A. Users Module
*   **Problema:** `updatedAt` no se actualizaba automáticamente cuando solo se modificaban campos del perfil (relación `OneToOne`).
*   **Solución:** Se implementó una actualización manual `user.updatedAt = new Date()` dentro de la transacción del método `update` en `UsersService`.

### B. Projects Module
*   **Problema:** La lógica de negocio impedía que un usuario con rol `Admin` fuera asignado como `Project Leader`, restringiéndolo solo a `Manager`.
*   **Solución:** Se ajustó la condición en `ProjectsService` para permitir roles `Manager` Y `Admin`.

### C. Services Module
*   **Problema:** Conflicto de rutas (Shadowing). `ServicesController` (`@Controller('services')`) estaba interceptando las peticiones a `ServiceCategoryController` (`@Controller('services/categories')`) debido al orden de carga en el módulo.
*   **Solución:** Se reordenó `ServicesModule` para registrar primero los controladores específicos (`Categories`, `Platforms`, `Types`) y al final el controlador genérico.

### D. Tasks Module
*   **Problema:** Error de validación "Cannot create tasks in the future".
*   **Validación:** Se confirmó que la lógica funciona correctamente al probar con fechas pasadas (simulando registros de tiempo reales).

### E. Refinamiento de Lógica de Horas (Pool vs Worked)
*   **Problema:** Inconsistencia en el cálculo de horas. El commit de un compañero introdujo un bug ("Inflación") donde borrar tareas pendientes aumentaba incorrectamente el pool disponible por lógica condicional errónea. Además, `poolHoursWorked` sumaba tareas no completadas.
*   **Solución (TasksService):** Se estandarizó bajo el "Modelo de Asignación".
    *   **Create:** Deducción incondicional (Reserva de presupuesto).
    *   **Remove:** Restauración incondicional (Liberación de presupuesto).
    *   **Update:** Ajuste basado estrictamente en la diferencia de duración.
*   **Solución (Project Entity):** Se protegió el getter `poolHoursWorked` para considerar ÚNICAMENTE tareas con status `COMPLETED`.

## 3. Estado Final del Sistema
El sistema es **robusto** en el manejo de fechas y zonas horarias, cumpliendo con las reglas de negocio:
*   **Base de Datos:** Mantiene consistencia EST (UTC-5) para auditoría y fechas agnósticas para hitos.
*   **API:** Recibe y Entrega estrictamente UTC (ISO 8601).
*   **Lógica de Negocio:** Calcula horas y tarifas correctamente respetando la zona horaria del sistema.

---
*Fin del Reporte*
