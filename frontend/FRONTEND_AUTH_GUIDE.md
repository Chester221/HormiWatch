# Guía de Implementación Frontend: Autenticación Segura (HttpOnly Cookies)

Esta guía detalla cómo integrar el frontend con el sistema de autenticación del backend, el cual utiliza **Cookies HttpOnly** para manejar el Refresh Token de manera segura y protegerse contra ataques XSS.

## 🚨 Requisito Crítico: `withCredentials`

Para que las cookies funcionen (se guarden y se envíen automáticamente), **TODAS** las peticiones al backend deben incluir la configuración `withCredentials: true`.

- Si usas **Axios**: `axios.defaults.withCredentials = true;`
- Si usas **Fetch**: `fetch(url, { credentials: 'include', ... })`

## 🔄 Flujos de Autenticación

### 1. Iniciar Sesión (Login)
*   **Endpoint:** `POST /api/v1/auth/login`
*   **Body:** `{ "email": "...", "password": "..." }`
*   **Respuesta (201 Created):**
    ```json
    {
      "accessToken": "eyJhbGciOiJIUz...",
      "user": { "id": "...", "email": "..." }
    }
    ```
*   **Acción Frontend:**
    1.  Guardar el `accessToken` en **memoria** (ej. React Context, Zustand Store, variable instanciada). **NO** guardarlo en `localStorage`.
    2.  Guardar los datos del usuario según convenga.
    3.  El navegador recibirá automáticamente una cookie llamada `refresh_token`. El código JS **no puede verla**, pero el navegador la gestionará.

### 2. Peticiones Protegidas
Para acceder a rutas protegidas, envía el `accessToken` en el header `Authorization`.

*   **Header:** `Authorization: Bearer <accessToken>`

### 3. Renovación de Token (Refresh Token)
Cuando el `accessToken` expire (recibas un error 401), debes intentar renovarlo usando el endpoint de refresh.

*   **Endpoint:** `POST /api/v1/auth/refresh`
*   **Configuración:** `withCredentials: true` (Vital para enviar la cookie).
*   **Body:** Vacío.
*   **Respuesta (201 Created):**
    ```json
    {
      "accessToken": "eyJhbGciOiJIUz... (nuevo)"
    }
    ```
*   **Acción Frontend:** Actualizar el `accessToken` en memoria y reintentar la petición original.

### 4. Cerrar Sesión (Logout)
*   **Endpoint:** `POST /api/v1/auth/logout`
*   **Headers:** `Authorization: Bearer <accessToken>`
*   **Configuración:** `withCredentials: true`.
*   **Acción:** El backend borrará la cookie y podrás limpiar el estado en el frontend.

---

## 💻 Ejemplo de Implementación (Axios + Interceptores)

Este es un patrón común para manejar la renovación automática ("Silent Refresh").

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  withCredentials: true, // ¡IMPORTANTE!
});

// Interceptor para inyectar el token en cada petición
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken; // Obtener de tu estado
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores 401 (Token Expirado)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no hemos reintentado aún
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Intentar renovar el token
        // NOTA: No enviamos body, la cookie viaja sola gracias a withCredentials
        const { data } = await api.post('/auth/refresh');
        
        // Actualizar el token en el estado de la app
        useAuthStore.getState().setAccessToken(data.accessToken);

        // Reintentar la petición original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Si falla el refresh (token inválido o expirado), cerrar sesión
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```
