# Manual de Usuario - HormiWatch

**Bienvenido a HormiWatch**, su plataforma para el control y gestión eficiente de proyectos y horas técnicas.

---

## 1. Acceso al Sistema

### Iniciar Sesión
1.  Ingrese a la página principal.
2.  Introduzca su correo electrónico y contraseña.
3.  Haga clic en **Ingresar**.
    *   *Nota*: Si es su primera vez, solicite sus credenciales al Administrador.

---

## 2. Roles y Permisos
El sistema adapta las opciones según su rol:
*   **Admin**: Acceso total (Usuarios, Configuración, Borrado).
*   **Manager**: Gestión de Proyectos, Asignación de tareas, Reportes.
*   **Technician**: Registro de tareas (Time Tracking) y visualización de sus asignarones.

---

## 3. Flujos de Trabajo

### 3.1. Gestión de Proyectos (Manager)
Para crear un nuevo proyecto:
1.  Vaya a la sección **Proyectos** > **Nuevo**.
2.  Complete el formulario:
    *   **Título**: Nombre del proyecto.
    *   **Líder**: Seleccione al responsable.
    *   **Técnicos**: Asigne el equipo de trabajo.
    *   **Horas Bolsa (Pool)**: Presupuesto total de horas estimadas.
3.  Haga clic en **Guardar**.

### 3.2. Registro de Tareas (Técnicos)
Para registrar sus horas trabajadas:
1.  Vaya a **Mis Tareas** o haga clic en el botón de **Nueva Tarea**.
2.  Seleccione:
    *   **Proyecto**: Proyecto al que imputar horas.
    *   **Servicio**: Tipo de actividad realizada (ej. Desarrollo, Soporte).
    *   **Inicio / Fin**: Fecha y hora exacta de la actividad.
3.  El sistema calculará automáticamente la duración y si aplica tarifa de horario especial (fines de semana/feriados).
4.  Sus horas se descontarán automáticamente de la "Bolsa de Horas" del proyecto.

### 3.3. Reportes
Para ver el estado de un proyecto:
1.  Vaya al detalle del proyecto.
2.  En la sección de reportes, elija:
    *   **PDF General**: Resumen ejecutivo.
    *   **PDF Usuarios**: Detalle por técnico.
    *   **Gráficos**: Visualización de consumo de horas.
3.  El archivo se descargará automáticamente.

---

## 4. Preguntas Frecuentes (FAQ)

**Q: ¿Qué hago si me equivoqué registrando una hora?**
A: Puede editar la tarea siempre que el proyecto no esté cerrado. Si modifica la duración, el sistema recalculará la bolsa de horas del proyecto automáticamente.

**Q: ¿Cómo sé qué tareas tengo pendientes?**
A: En su Dashboard principal verá un resumen de tareas "En Progreso" o "Pendientes".

**Q: ¿Puedo registrar horas fuera de fecha?**
A: Sí, el sistema permite carga retroactiva, pero validará que no se solape con otras tareas ya registradas por usted en ese mismo horario.
