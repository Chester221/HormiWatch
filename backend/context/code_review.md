# Revisión de Código Backend HormiWatch (Deep Code Review)

**Fecha**: 2026-01-12
**Analista**: Staff Engineer (AI Agent)
**Contexto**: Backend NestJS

Este documento detalla el análisis del código fuente basado en los criterios de calidad establecidos: S.O.L.I.D, Patrones de Diseño, Manejo de Errores, Seguridad y Rendimiento.

---

## 1. S.O.L.I.D & Clean Code

### Hallazgos Principales
*   **Violación de SRP (Single Responsibility Principle) en Servicios**:
    *   **Archivo**: `src/modules/users/users.service.ts`
    *   **Método**: `create()`
    *   **Análisis**: Este método actúa como un "God Method". Orquesta demasiadas responsabilidades simultáneamente:
        1.  Validación de Rol.
        2.  Hashing de Contraseña.
        3.  Subida de Archivos (Storage).
        4.  Transacción de Base de Datos (User + Profile).
        5.  Emisión de Eventos (`EventEmitter`).
        6.  Manejo de errores y compensación (Rollback de archivos).
    *   **Recomendación**: Refactorizar hacia un patrón **Case de Uso (UserCase/Interactor)** o separar la lógica de orquestación de la lógica de persistencia. El servicio debería delegar la subida de archivos y el hashing a proveedores específicos antes de iniciar la transacción, o usar un Facade.

*   **Cohesión de Clases**:
    *   La clase `UsersService` (aprox. 600 líneas) mezcla lógica de presentación de datos (DTO transformation), lógica de negocio y persistencia directa.

---

## 2. Patrones de Diseño

### Estado Actual: Arquitectura en Capas (Layered)
El proyecto sigue una arquitectura estándar de NestJS (Controller -> Service -> Repository).

*   **Repositorios**:
    *   **Observación**: No se implementan Repositorios del Dominio (Interface Adapter Pattern). Se inyectan directamente `Repository<Entity>` de TypeORM en los servicios (`@InjectRepository(User)`).
    *   **Impacto**: Alto acoplamiento con TypeORM. Dificulta el testing unitario puro sin mocks de TypeORM.
    *   **Recomendación**: Crear interfaces de Repositorio en una capa de Dominio y sus implementaciones en Infraestructura.

*   **Casos de Uso (Interactors)**:
    *   **Observación**: Ausentes explícitamente. La lógica de aplicación reside en los Servicios.
    *   **Recomendación**: Para flujos complejos como `create user`, implementar clases `CreateUserUseCase` que encapsulen la regla de negocio pura.

*   **DTOs (Data Transfer Objects)**:
    *   **Estado**: ✅ Correctamente implementados.
    *   Se usan `CreateUserDto`, `UserResponseDto` y `PageOptionsDto`.
    *   Se utiliza `plainToInstance` para la transformación de salida, evitando exponer entidades de base de datos (Security best practice).

---

## 3. Manejo de Errores

*   **Filtros Globales**:
    *   **Estado**: ✅ `QueryFailedFilter` implementado y registrado globalmente.
    *   **Análisis**: Mapea correctamente errores de MySQL (duplicados, foreign keys) a excepciones HTTP (409 Conflict, 422 Unprocessable Entity). Esto evita fugar detalles de la base de datos al cliente.

*   **Consistencia**:
    *   Uso adecuado de `NotFoundException` en los servicios cuando no se encuentran recursos.

---

## 4. Seguridad

*   **Autenticación & Autorización**:
    *   **Estado**: ✅ Muy Fuerte.
    *   **Manejo de Tokens**: El `RefreshToken` se almacena en una **Cookie HttpOnly, Secure y SameSite=Strict**. Esto mitiga significativamente ataques XSS.
    *   **Guards**: `JwtAuthGuard` implementado correctamente usando `Reflector` para permitir endpoints públicos con `@SkipAuth()`.
    *   **Validación de Estrategia**: `JwtStrategy` valida que el usuario siga activo (`isActive`) en cada petición. Esto permite revocación inmediata de acceso, aunque tiene un costo de rendimiento.

*   **Validación de Entrada**:
    *   `ValidationPipe` global con `whitelist: true` y `forbidNonWhitelisted: true`. Esto previene ataques de Mass Assignment.

---

## 5. Rendimiento

*   **Consultas a Base de Datos (Optimización)**:
    *   **Estado**: ✅ Bueno.
    *   **Selective Selects**: En `findAll` y `findOne`, se especifican explícitamente los campos a seleccionar (`queryBuilder.select(...)`). Esto evita traer columnas pesadas (`password`, `refreshToken`) o innecesarias de la base de datos.
    *   **Paginación**: Implementada correctamente a nivel de base de datos (`skip`/`take`).

*   **Concurrencia**:
    *   **Estado**: ✅ Excelente.
    *   En `UsersService.create`, se utiliza `Promise.allSettled` para paralelizar tareas independientes (fetch de rol, hash de password y subida de archivo). Esto reduce la latencia total del endpoint.

*   **Posibles Cuellos de Botella**:
    *   **Validación de Sesión**: La estrategia JWT hace una consulta a base de datos (`findOneByIdForAuth`) en **cada petición** para verificar el estado del usuario.
    *   **Mitigación recomendada**: Si el tráfico escala, considerar cachear el estado del usuario (Redis) o aceptar el riesgo de un "breve periodo de validez" confiando solo en la firma del token (stateless).

---

## Resumen de Acciones Recomendadas

1.  **Refactorizar `UsersService.create`**: Extraer la lógica a un `CreateUserUseCase` o dividir en métodos privados para adherirse a SRP.
2.  **Abstraer Repositorios**: Si se busca una arquitectura Hexagonal estricta, introducir interfaces `IUserRepository`.
3.  **Monitorear DB Hits en Auth**: Vigilar el impacto de consultar la DB en cada request autenticado.
