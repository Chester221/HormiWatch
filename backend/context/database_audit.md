# Auditoría Técnica de Base de Datos - HormiWatch

**Fecha:** 12 de Enero de 2026
**Auditor:** Agente AI (DBA Specialist)
**Alcance:** Entidades de TypeORM y Configuración del Backend

## 1. Resumen Ejecutivo
La base de datos de HormiWatch presenta una arquitectura sólida orientada a microservicios o módulos bien definidos, utilizando identificadores UUID v4 para todas las entidades, lo cual facilita la escalabilidad y seguridad. El modelo de datos está altamente normalizado, con un enfoque particular en la gestión de tiempos y tareas, evidenciado por un esquema de indexación robusto en la entidad `Task`.

**Hallazgo Crítico:** No se encontraron archivos de migración en la estructura de directorios estándar ni scripts de ejecución en `package.json`. La configuración `synchronize: false` sugiere que el esquema podría gestionarse externamente o que falta la infraestructura de migraciones en el código fuente actual.

---

## 2. Análisis Detallado

### 2.1. Normalización
**Estado: Excelente**
El esquema sigue las reglas de normalización hasta 3NF (Tercera Forma Normal) en la mayoría de los casos.

*   **Desacoplamiento de Entidades:**
    *   La información de perfil (`Profile`) se ha separado de la autenticación (`User`), lo cual es una buena práctica de particionamiento vertical.
    *   Las preferencias de notificación están aisladas en `NotificationPreference`.
*   **Catálogos Normalizados:**
    *   Los servicios no almacenan cadenas de texto repetitivas, sino que referencian a entidades de catálogo (`ServiceCategory`, `ServicePlatform`, `ServiceType`). Esto evita redundancia y anomalías de actualización.
*   **Gestión de Contactos:**
    *   La separación entre `Customer` y `CustomerContact` permite que un cliente corporativo tenga múltiples puntos de contacto sin duplicar la información de la empresa.

### 2.2. Relaciones (One-to-Many, Many-to-Many)
**Estado: Correcto y Eficiente**

*   **Relación Many-to-Many (`User` <-> `Project`):**
    *   Implementada correctamente con una tabla intermedia explícita en TypeORM (`assigned_technicians`). Esto permite asignar múltiples técnicos a múltiples proyectos.
*   **Relaciones Jerárquicas:**
    *   `Project` -> `Task` (One-to-Many) y `Service` -> `Task` (One-to-Many) están bien definidas.
*   **Carga de Relaciones (Eager vs Lazy):**
    *   **Observación:** No se detectó el uso de `eager: true` en las definiciones de entidad.
    *   **Evaluación:** Esto es positivo para el rendimiento general, ya que evita la carga innecesaria de grafos de objetos profundos (Problemática N+1). Sin embargo, requiere que los desarrolladores sean disciplinados usando `.find({ relations: [...] })` o `QueryBuilder` para traer los datos necesarios.

### 2.3. Indexación y Rendimiento
**Estado: Muy Bueno (Destacado en `Task`)**

*   **Índices Compuestos en `Task`:**
    Se han definido índices estratégicos que cubren los patrones de acceso más comunes para reportes de tiempo:
    *   `['project', 'startDateTime']`
    *   `['technician', 'startDateTime']`
    *   `['service', 'startDateTime']`
    *   `['status', 'startDateTime']`
    *   `['priority', 'startDateTime']`
    
    *Por qué esto es bueno:* La inclusión de `startDateTime` como segundo campo en estos índices compuestos permite filtrar por "Proyecto X en el Rango de Fechas Y" de manera extremadamente veloz, sin scans completos de tabla.

*   **Índices Únicos:**
    *   `User.email`, `Role.name`, `Service.name`, etc., garantizan la integridad de datos a nivel de base de datos.

*   **Sugerencia de Mejora:**
    *   Considerar índice en `Project.status` si hay dashboard que filtra muchos proyectos inactivos.
    *   Verificar si `Customer.name` se usa para búsquedas difusas (LIKE); si es así, un índice estándar B-Tree podría no ser suficiente (considerar Full Text Search si crece mucho).

### 2.4. Tipado y Restricciones
**Estado: Sólido**

*   **Identificadores (UUID):**
    *   Uso consistente de `BaseUuidEntity`. Los UUID evitan colisiones de ID en entornos distribuidos y evitan enumeración de recursos (security through obscurity).
*   **Tipos de Datos:**
    *   `decimal` con `precision: 13, scale: 4` para `hourlyRate` y `appliedHourlyRate`. **Crucial:** Se usa un `transformer` para convertir de string (BD) a number (JS), lo cual maneja correctamente la precisión monetaria que el tipo `float` destruiría.
    *   `Temporal.Instant` y `Temporal.PlainDate`: Uso de la API moderna de fechas con transformers personalizados (`TemporalInstantTransformer`). Esto es muy avanzado y evita los dolores de cabeza de `Date` nativo de JS y zonas horarias.
*   **Restricciones (Constraints):**
    *   Uso apropiado de `nullable: false` en relaciones obligatorias (`technician`, `service` en Task).
    *   `onDelete: 'CASCADE'` en `Profile` -> `User` asegura que no queden perfiles huérfanos.

### 2.5. Consistencia con el Dominio
**Estado: Alta**

El modelo refleja fielmente un sistema de **Seguimiento de Tiempo y Gestión de Proyectos (PSA)** orientado a servicios técnicos.
*   **Terminología:** `Technician`, `Pool Hours`, `Hourly Rate`, `Service Platform` sugieren un negocio de consultoría técnica o mantenimiento.
*   **Reglas de Negocio en Entidades:**
    *   La entidad `Task` tiene un getter `durationInHours` que encapsula la lógica de cálculo de tiempo usando `Temporal`, asegurando que la regla de negocio "duración = fin - inicio" sea consistente en toda la app.
    *   La entidad `Holiday` con `isWorkingDay` indica soporte para calendarios laborales.

---

## 3. Recomendaciones y Próximos Pasos

1.  **Implementar Sistema de Migraciones:**
    *   **Alta Prioridad.** La ausencia de archivos de migración es un riesgo. Se recomienda configurar `typeorm migration:generate` y `migration:run` para tener un control de versiones del esquema de BD.
    
2.  **Auditoría de Campos JSON:**
    *   La entidad `Audit` usa columnas `json` para `oldValues` y `newValues`. Asegurarse de que MySQL 5.7+ o 8.0 se esté utilizando para aprovechar las funciones nativas de JSON si se planea consultar dentro de estos campos.

3.  **Validación de Índices:**
    *   Monitorizar el rendimiento de las consultas de "Búsqueda de Tareas por Rango de Fechas Global" (sin filtro de proyecto/técnico). Si existe ese caso de uso, se necesitaría un índice solo en `startDateTime`.

4.  **Soft Deletes:**
    *   Todas las entidades heredan `deleteAt`. Verificar que todas las consultas de negocio filtren por defecto los eliminados (TypeORM lo hace automático con `find`, pero `QueryBuilder` requiere `withDeleted: false` explícito si no se maneja con cuidado).

---
*Generado por Agente AI (Antigravity)*
