¡Fantástico\! Hemos avanzado muchísimo. El frontend ya es interactivo.

Aquí tienes tu `README.md` actualizado para reflejar todo el increíble progreso que hemos hecho. He marcado como completadas todas las tareas de las Fases 1, 2 y 3 que ya terminamos, y he reordenado las Fases 3 y 4 para que muestren los siguientes pasos lógicos.

-----

# Proyecto: MAYACLEAN POS 🧺

Un Punto de Venta (POS) web moderno para lavanderías, enfocado en la automatización de la comunicación con el cliente y programas de lealtad.

## Propósito del Proyecto

El objetivo es crear un sistema POS que no solo gestione clientes y pedidos, sino que también mejore la retención de clientes a través de:

  * Gestión de pedidos (por kilo o prenda).
  * Notificaciones de estado (Ticket, Pedido Listo, En Entrega).
  * Sistema de lealtad (ej. "décimo servicio gratis").
  * Gestión de servicio a domicilio.
  * Dashboard de pedidos con estado de tiempo real (A Tiempo, Demorado, Atrasado).

## Tech Stack (Tecnologías)

  * **Backend:** Node.js (ESM) con Express.js.
  * **Base de Datos:** Neon (PostgreSQL).
  * **Frontend:** HTML5, CSS3 y JavaScript (Vanilla JS).
  * **Gestor de Paquetes:** `pnpm`.
  * **Notificaciones:** SendGrid (Email) y `wa.me` (WhatsApp).
  * **Despliegue:**
      * **Backend (API):** Render
      * **Base de Datos:** Neon
      * **Frontend:** Vercel

-----

## 🚧 Roadmap (TODO List) 🚧

Esta es la guía de pasos para construir el proyecto.

### Fase 1: Backend - Autenticación y Seguridad (El Login)

  * [X] **(Backend)** Crear la carpeta `src/routes/auth.routes.js` y `src/controllers/auth.controller.js`.
  * [X] **(Backend)** Instalar `bcryptjs` y `jsonwebtoken`.
  * [X] **(Backend)** [Ruta `POST /api/auth/register`]
  * [X] **(Backend)** [Ruta `POST /api/auth/login`]
  * [X] **(Backend)** Crear un *middleware* `verificarToken.js`.

### Fase 2: Backend - Lógica de Negocio (Clientes y Pedidos)

  * [X] **(Backend)** Crear las rutas y controladores para `Clientes` (`POST /api/clientes` y `GET /api/clientes/buscar`).
  * [X] **(Backend)** Añadir soporte para `direccion` y `servicio_domicilio` en Clientes y Pedidos.
  * [X] **(Backend)** Crear las rutas y controladores para `Pedidos`.
  * [X] **(Backend)** [Ruta `GET /api/pedidos/dashboard`]
  * [X] **(Backend)** [Ruta `POST /api/pedidos`]
  * [X] **(Backend)** [Ruta `PUT /api/pedidos/:folio/estado`]
  * [X] **(Backend)** [Lógica de Lealtad] (Integrada en la ruta `PUT` de Pedidos).

### Fase 3: Frontend - Vistas y Lógica (Vanilla JS)

  * [X] **(Frontend)** Crear la estructura de `frontend/` (`index.html`, `dashboard.html`, `nueva-orden.html`, `style.css`, `src/`).
  * [X] **(Frontend)** Crear `src/services/api.js` y añadir todas las funciones (login, dashboard, clientes, pedidos).
  * [X] **(Frontend)** [Lógica de Login] (`src/login.js`)
      * `addEventListener` al formulario de login.
      * Llamar a `api.login()`.
      * Guardar token en `localStorage`.
      * Redirigir a `dashboard.html`.
  * [X] **(Frontend)** [Lógica de Dashboard] (`src/dashboard.js`)
      * Verificar token en `localStorage` (seguridad de ruta).
      * Llamar a `api.getDashboardPedidos(token)`.
      * Renderizar dinámicamente las "tarjetas de pedido".
      * Añadir botones "Marcar como Listo" y "Entregar y Pagar".
      * Añadir `EventListener` para manejar los clics de los botones de estado.
  * [X] **(Frontend)** [Lógica de Estado de Tiempo (24h)]
      * Implementada en `dashboard.js` al renderizar las tarjetas.
  * [X] **(Frontend)** [Lógica de Roles]
      * Implementada en `dashboard.js` para ocultar botones si no es 'admin'.
  * [X] **(Frontend)** [Lógica de "Crear Nueva Orden"] (`src/nueva-orden.js`)
      * Flujo de buscar cliente (`api.buscarCliente`).
      * Flujo de crear nuevo cliente (`api.crearCliente`).
      * Cálculo de precio total.
      * Guardar el pedido (`api.crearPedido`).

### Fase 4: Notificaciones y Despliegue

  * [X] **(Deploy)** Desplegar el `backend/` en Render.
  * [X] **(Deploy)** Configurar las Variables de Entorno en Render (`DATABASE_URL`, `JWT_SECRET`).
  * [ ] **(Deploy)** Desplegar el `frontend/` en Vercel.
  * [ ] **(Deploy)** [Keep-Alive de Neon]
      * Crear la ruta `GET /api/keep-alive` en el backend.
      * Crear el archivo `.github/workflows/keep-alive.yml` para hacer "ping" diario.
  * [ ] **(Backend)** [Fase 1: Email]
      * Instalar SendGrid (`pnpm add @sendgrid/mail`).
      * Crear `src/services/notificaciones.service.js`.
      * Llamar a `notificaciones.enviarTicket(pedido)` después de crear un pedido.
  * [ ] **(Frontend)** [Fase 2: WhatsApp]
      * En `dashboard.js`, modificar `crearTarjetaPedido` para añadir un botón "Avisar por WhatsApp" (`wa.me/...`).

-----

## Estructura de Carpetas

(La estructura de carpetas permanece igual)

```
/lavanderia_pos/
│
├── .github/
│   └── workflows/
│       └── keep-alive.yml      # (Para Neon)
│
├── backend/                    # (Proyecto Node.js / Express)
│   │
│   ├── src/
│   │   ├── config/             # (db.config.js - Conexión a Neon)
│   │   ├── controllers/        # (auth.controller.js, pedidos.controller.js, ...)
│   │   ├── middleware/         # (verificarToken.js)
│   │   ├── models/             # (Lógica de queries, si se necesita)
│   │   ├── routes/             # (auth.routes.js, pedidos.routes.js, ...)
│   │   ├── services/           # (notificaciones.service.js)
│   │   └── index.js            # El servidor principal (Express)
│   │
│   ├── .env                    # (¡Ignorado por Git!)
│   ├── .gitignore
│   ├── package.json
│   └── pnpm-lock.yaml
│
├── frontend/                   # (Proyecto Vanilla JS)
│   │
│   ├── src/
│   │   ├── services/           # (api.js - Lógica de fetch)
│   │   ├── login.js
│   │   ├── dashboard.js
│   │   └── nueva-orden.js
│   │
│   ├── assets/                 # (Imágenes, iconos)
│   ├── index.html              # (Página de Login)
│   ├── dashboard.html
│   ├── nueva-orden.html
│   └── style.css
│
└── README.md                   # (Este archivo)
```