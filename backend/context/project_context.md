# HormiWatch - Contexto del Proyecto

## 1. Visión General
**Propósito**: HormiWatch es una aplicación diseñada para contabilizar y gestionar el tiempo de trabajo de los técnicos de manera eficiente.
**Propuesta de Valor**: Provee una herramienta sencilla y robusta para el registro de horas, eliminando complejidad innecesaria y centrando el valor en la precisión del control de tiempos operativos.

## 2. Stack Tecnológico
Basado en el análisis del código actual (`package.json`):

*   **Framework Principal**: NestJS v11
*   **Lenguaje**: TypeScript
*   **Base de Datos**: MySQL (Uso de `mysql2` y `typeorm`)
*   **ORM**: TypeORM
*   **Autenticación**: Implementación Propia/Local
    *   Librerías: `passport`, `passport-jwt`, `argon2` (hashing seguro)
*   **Gestor de Paquetes**: pnpm (Inferido por `pnpm-lock.yaml`)
*   **Herramientas de Entorno**: `@nestjs/config` (Variables de entorno)

## 3. Arquitectura
*   **Estilo Arquitectónico**: Modular (Standard NestJS)
    *   El código está organizado en módulos bajo `src/modules`, promoviendo la separación de dominios.
*   **Patrones Clave**:
    *   Inyección de Dependencias (DI) nativa de NestJS.
    *   Uso de DTOs (`class-validator`, `class-transformer`) para validación de entrada.
    *   Repositorios (Pattern Repository con TypeORM).

## 4. Integraciones de Terceros
*   **Supabase Storage**: Servicio principal para el almacenamiento de archivos (imágenes, documentos, etc.) a través de su API de Storage.
*   **Google Calendar API**: Utilizada en `HolidaysService` para sincronizar automáticamente los días feriados de Venezuela.
*   **Nodemailer**: Motor para el envío de correos electrónicos transaccionales.
*   **PDFMake**: Generación de reportes y documentos en formato PDF.
*   **Chart.js / QuickChart**: Generación de gráficos para reportes visuales o dashboards.

## 5. Reglas de Negocio Críticas (Gold Rules)
*Estas reglas definen la integridad del sistema y deben ser respetadas por cualquier desarrollo futuro:*

1.  **Integridad del Tiempo**: El registro de horas de los técnicos debe ser preciso y auditable.
2.  **Simplicidad**: La aplicación debe mantenerse sencilla; evitar sobre-arquitectura innecesaria (ej. no requerir organizaciones complejas si no es necesario).
3.  **Seguridad de Datos**: Los datos sensibles (contraseñas) siempre deben estar hasheados (Argon2).
4.  *[Espacio reservado para regla de negocio específica del cliente]*
5.  *[Espacio reservado para regla de negocio específica del cliente]*
