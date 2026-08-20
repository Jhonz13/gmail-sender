# ✉️ Gmail Job Outreach CRM - Aplicación de Envíos Masivos

Aplicación web personal y segura desarrollada con **React (Vite)** y **Node.js (Express)** para enviar campañas de correos masivos personalizados directamente desde tu cuenta personal de Gmail utilizando la API oficial de Google y autenticación segura OAuth 2.0.

Especialmente optimizada para la búsqueda de empleo, prospección profesional y contactos de recruiting.

---

## 🌟 Características Principales

1. **Autenticación Oficial Gmail (OAuth 2.0)**:
   - Conexión directa y segura con Google sin almacenar contraseñas.
   - Botón de desconexión fácil para revocar permisos cuando desees.
2. **Personalización Dinámica de Correos**:
   - Variables dinámicas `{nombre}`, `{empresa}`, `{puesto}` e interpolación automática en el asunto y cuerpo.
3. **Gestor de Destinatarios**:
   - Editor en tabla interactiva, importación por pegado rápido y archivos CSV.
   - Eliminación automática de duplicados y comprobación de formato.
4. **Protección Anti-Spam y Control de Envíos**:
   - Selector de retardo configurable entre envíos (5 a 30 segundos) para respetar los límites de Gmail.
   - Consola de progreso en tiempo real con barra de avance, porcentaje, contador de exitosos/fallidos y logs detallados.
   - Botones para **Pausar**, **Reanudar** y **Cancelar** el envío en cualquier momento.
   - Advertencia preventiva si se intenta enviar a más de 20 destinatarios.
5. **Extras para Búsqueda de Empleo**:
   - Soporte para adjuntar tu **Curriculum Vitae (PDF)** a todos los correos.
   - Gestor de **Plantillas guardadas** para reutilizar asuntos y mensajes frecuentes.
   - Historial detallado de envíos pasados.

---

## 🔑 Guía Paso a Paso: Configuración de Credenciales en Google Cloud

Para poder enviar correos desde tu Gmail, necesitas obtener una clave de **Client ID** y **Client Secret** desde Google Cloud (servicio 100% gratuito para uso personal):

### 1. Crear Proyecto
1. Accede a [Google Cloud Console](https://console.cloud.google.com/).
2. Haz clic en el desplegable de proyectos en la barra superior y selecciona **"Proyecto Nuevo"**.
3. Ponle un nombre (ejemplo: `Gmail-Outreach-Personal`) y haz clic en **Crear**.

### 2. Habilitar la API de Gmail
1. En el menú lateral izquierdo, ve a **APIs y Servicios** > **Biblioteca**.
2. En el buscador, escribe `Gmail API`.
3. Haz clic en la **Gmail API** y presiona el botón **Habilitar**.

### 3. Configurar la Pantalla de Consentimiento OAuth
1. En el menú lateral, selecciona **APIs y Servicios** > **Pantalla de consentimiento de OAuth**.
2. Elige la opción **External** (Externa) y haz clic en **Crear**.
3. Rellena los datos básicos:
   - **Nombre de la app**: `Gmail Outreach CRM`
   - **Correo de asistencia al usuario**: Tu correo de Gmail.
   - **Información de contacto del desarrollador**: Tu correo de Gmail.
4. Haz clic en **Guardar y continuar**.
5. En la sección de **Usuarios de prueba (Test users)**, haz clic en **"ADD USERS"** y agrega tu propia dirección de correo de Gmail. *(Paso fundamental para permitir el inicio de sesión)*.

### 4. Crear Credenciales OAuth 2.0
1. Ve a **APIs y Servicios** > **Credenciales**.
2. Haz clic en **"Crear credenciales"** > **"ID de cliente de OAuth"**.
3. Configura los siguientes datos:
   - **Tipo de aplicación**: `Aplicación web`
   - **Nombre**: `Cliente Web Gmail Outreach`
   - **URI de redireccionamiento autorizados**: Añade exactamente:
     ```text
     http://localhost:3001/api/auth/google/callback
     ```
4. Haz clic en **Crear**. Se desplegará una ventana con tu **ID de cliente** (Client ID) y tu **Secreto de cliente** (Client Secret). Copia ambos valores.

---

## 🚀 Instrucciones de Ejecución Local

### Prerrequisitos
- Node.js (v18 o superior) instalado.

### 1. Iniciar el Servidor Backend (Node.js/Express)

```bash
cd server
npm install
npm start
```
El backend se iniciará en `http://localhost:3001`.

### 2. Iniciar el Cliente Frontend (React/Vite)

En una nueva terminal:

```bash
cd client
npm install
npm run dev
```
La aplicación web se abrirá en `http://localhost:5173`.

---

## ⚙️ Uso de la Aplicación Web

1. Abre `http://localhost:5173` en tu navegador.
2. Haz clic en **"Configurar OAuth ID"** o en el botón del banner superior e ingresa tu **Client ID** y **Client Secret** copiados de Google Cloud Console.
3. Haz clic en **"Conectar con Gmail"** e inicia sesión con tu cuenta de Google.
4. Agrega los destinatarios en la tabla o pega tu lista de correos.
5. Diseña el asunto y el mensaje introduciendo las variables `{nombre}`, `{empresa}`, `{puesto}` según lo requieras.
6. (Opcional) Adjunta tu CV en formato PDF y guarda la plantilla para usos futuros.
7. Haz clic en **"Vista Previa del Correo"** para validar la personalización por cada contacto y presiona **"Enviar Correos Masivos"**.
8. Observa el progreso en tiempo real y gestiona la cola en directo.
