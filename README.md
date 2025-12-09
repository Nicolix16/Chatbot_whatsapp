# Chatbot Avellano - WhatsApp Business

Sistema de chatbot para WhatsApp integrado con panel de administración web.

## 🏗️ Arquitectura del Proyecto

```
chatbot-avellano/
├── backend/               # Servidor Node.js + TypeScript
│   ├── src/
│   │   ├── config/       # Configuración (DB, environment)
│   │   ├── models/       # Modelos Mongoose
│   │   ├── routes/       # Rutas API REST
│   │   ├── middleware/   # Middlewares (auth, etc.)
│   │   ├── flows/        # Flujos del chatbot
│   │   ├── services/     # Servicios (WhatsApp, Email)
│   │   ├── scripts/      # Scripts de migración/seed
│   │   ├── app.ts        # Bot de WhatsApp
│   │   └── server.ts     # Servidor API REST
│   ├── package.json
│   ├── tsconfig.json
│   └── nodemon.json
│
├── frontend/             # Panel de administración web
│   └── public/
│       ├── pages/        # HTML (login, dashboard)
│       ├── css/          # Estilos
│       ├── js/           # JavaScript
│       │   ├── config.js
│       │   ├── app.js
│       │   └── utils/    # Utilidades (api, auth, helpers)
│       └── assets/       # Imágenes y recursos
│
├── shared/               # Tipos compartidos
│   └── types/
│
├── docker-compose.yml    # Orquestación Docker
├── Dockerfile            # Imagen Docker del backend
└── README.md
```

## 🚀 Instalación y Configuración

### Requisitos Previos

- Node.js 18+
- MongoDB 6+
- npm o pnpm

### Configuración del Backend

1. **Navegar a la carpeta backend:**
   ```bash
   cd backend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Crear archivo `.env`:**
   ```env
   # MongoDB
   MONGO_URI=mongodb://localhost:27017/avellano-chatbot

   # Puertos
   PORT=3008
   API_PORT=3009

   # JWT Secrets
   JWT_SECRET=tu_secret_super_seguro_cambiar_en_produccion
   JWT_REFRESH_SECRET=tu_refresh_secret_super_seguro_cambiar_en_produccion

   # WhatsApp Business API
   JWT_TOKEN=tu_token_de_whatsapp_business
   NUMBER_ID=tu_numero_id_whatsapp
   VERIFY_TOKEN=tu_verify_token
   PROVIDER_VERSION=v21.0

   # SendGrid (opcional)
   SENDGRID_API_KEY=tu_api_key_de_sendgrid
   SENDGRID_FROM_EMAIL=noreply@avellano.com

   # Frontend URL
   FRONTEND_URL=http://localhost:3009
   ```

4. **Compilar TypeScript:**
   ```bash
   npm run build
   ```

5. **Crear usuario administrador:**
   ```bash
   npm run seed:user
   ```

### Ejecución en Desarrollo

**Terminal 1 - Bot de WhatsApp:**
```bash
cd backend
npm run dev
```

**Terminal 2 - API REST:**
```bash
cd backend
npm run dev:api
```

El panel estará disponible en: `http://localhost:3009`

### Ejecución en Producción

**Con Node.js:**
```bash
cd backend
npm run build
npm start          # Inicia el bot
npm run start:api  # Inicia la API
```

**Con Docker:**
```bash
docker-compose up -d
```

## 📦 Scripts Disponibles

### Backend

```bash
npm run dev          # Desarrollo - Bot WhatsApp
npm run dev:api      # Desarrollo - API REST
npm run build        # Compilar TypeScript
npm start            # Producción - Bot
npm run start:api    # Producción - API
npm run seed:user    # Crear usuario admin
npm run seed:pedidos # Crear datos de prueba
npm run migrate      # Migrar clientes
```

## 🔐 Autenticación y Roles

### Roles Disponibles

- **Administrador**: Acceso total al sistema
- **Operador**: Gestión de clientes asignados
  - Coordinador Masivos
  - Director Comercial
  - Ejecutivo Horecas
  - Mayorista
- **Soporte**: Creación de eventos y soporte

### Flujo de Autenticación

1. **Login**: POST `/api/auth/login`
   - Devuelve `accessToken` (15 min) y `refreshToken` (7 días)
2. **Refresh**: POST `/api/auth/refresh`
   - Renueva tokens automáticamente
3. **Logout**: POST `/api/auth/logout`
   - Invalida refresh token

## 🛣️ API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/forgot-password` - Recuperar contraseña
- `POST /api/auth/reset-password` - Restablecer contraseña

### Clientes
- `GET /api/clientes` - Listar clientes
- `GET /api/clientes/:telefono` - Obtener cliente

### Pedidos
- `GET /api/pedidos` - Listar pedidos
- `GET /api/pedidos/:id` - Obtener pedido

### Conversaciones
- `GET /api/conversaciones` - Listar conversaciones
- `GET /api/conversaciones/:telefono` - Detalle conversación

### Eventos
- `GET /api/eventos` - Listar eventos
- `GET /api/eventos/:id` - Detalle evento
- `POST /api/eventos` - Crear y enviar evento

### Usuarios (Solo Admin)
- `GET /api/usuarios` - Listar usuarios
- `POST /api/usuarios` - Crear usuario
- `POST /api/usuarios/bulk` - Importar usuarios CSV
- `PATCH /api/usuarios/:id/rol` - Actualizar rol
- `PATCH /api/usuarios/:id/estado` - Activar/Desactivar
- `DELETE /api/usuarios/:id` - Eliminar usuario

### Estadísticas
- `GET /api/powerbi/stats` - Estadísticas generales

## 🗂️ Modelos de Base de Datos

### Cliente
```typescript
{
  telefono: string
  nombre: string
  nombreNegocio: string
  ciudad: string
  tipoCliente: 'hogar' | 'hotel' | 'restaurante' | 'panadería' | ...
  responsable: string
  fechaRegistro: Date
}
```

### Pedido
```typescript
{
  telefono: string
  productos: Array<{nombre, cantidad}>
  fechaPedido: Date
  estado: 'pendiente' | 'procesado' | 'cancelado'
}
```

### Usuario
```typescript
{
  email: string
  passwordHash: string
  nombre: string
  rol: 'administrador' | 'operador' | 'soporte'
  tipoOperador?: string
  activo: boolean
  refreshToken?: string
}
```

## 🔧 Tecnologías Utilizadas

### Backend
- **Node.js + TypeScript**
- **Express.js** - Framework web
- **MongoDB + Mongoose** - Base de datos
- **BuilderBot** - Framework chatbot WhatsApp
- **JWT** - Autenticación
- **bcryptjs** - Hashing de contraseñas
- **SendGrid** - Envío de emails

### Frontend
- **HTML5 + CSS3 + JavaScript**
- **Fetch API** - Peticiones HTTP
- **LocalStorage** - Gestión de tokens

## 📝 Variables de Entorno

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `MONGO_URI` | URI de MongoDB | Sí |
| `PORT` | Puerto del bot WhatsApp | No (default: 3008) |
| `API_PORT` | Puerto de la API | No (default: 3009) |
| `JWT_SECRET` | Secret para access tokens | Sí |
| `JWT_REFRESH_SECRET` | Secret para refresh tokens | Sí |
| `JWT_TOKEN` | Token WhatsApp Business API | Sí |
| `NUMBER_ID` | ID del número WhatsApp | Sí |
| `VERIFY_TOKEN` | Token de verificación | Sí |
| `SENDGRID_API_KEY` | API Key de SendGrid | No |
| `SENDGRID_FROM_EMAIL` | Email remitente | No |

## 🐳 Docker

### Construir imagen
```bash
docker build -t avellano-chatbot .
```

### Ejecutar con docker-compose
```bash
docker-compose up -d
```

### Ver logs
```bash
docker-compose logs -f backend
```

### Detener servicios
```bash
docker-compose down
```

## 📄 Licencia

Propietario - Avellano © 2024

## 👥 Soporte

Para soporte técnico, contactar al equipo de desarrollo.
