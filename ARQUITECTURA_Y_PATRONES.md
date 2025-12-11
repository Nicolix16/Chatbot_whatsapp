# 🏗️ Arquitectura y Patrones de Diseño - Chatbot Avellano

## 📋 Tabla de Contenidos

1. [Arquitectura General](#-arquitectura-general)
2. [Componentes del Sistema](#-componentes-del-sistema)
3. [Patrones de Diseño](#-patrones-de-diseño)
4. [Flujo de Comunicación](#-flujo-de-comunicación)
5. [Tipos de Clientes](#-tipos-de-clientes)
6. [Sistema de Notificaciones](#-sistema-de-notificaciones)
7. [Seguridad](#-seguridad)
8. [Despliegue](#-despliegue)

---

## 🏗️ Arquitectura General

Este proyecto implementa una **arquitectura moderna de tres capas** completamente separadas:

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIOS FINALES                          │
└─────────────────────────────────────────────────────────────┘
                    │                    │
         ┌──────────┴──────────┐    ┌───┴──────────┐
         │                     │    │              │
    WhatsApp API          Frontend React      Operadores
    (Clientes)           (Dashboard Web)      (WhatsApp)
         │                     │                   │
         │                     │                   │
         └──────────┬──────────┴──────────┬────────┘
                    │                     │
              ┌─────▼─────────────────────▼─────┐
              │      BACKEND NODE.JS              │
              │  ┌─────────────┐  ┌────────────┐ │
              │  │   Bot WA    │  │  API REST  │ │
              │  │ (Puerto     │  │ (Puerto    │ │
              │  │  3008)      │  │  3009)     │ │
              │  └─────────────┘  └────────────┘ │
              └───────────────┬───────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   MongoDB Atlas    │
                    │  (Base de Datos)   │
                    └────────────────────┘
```

### Arquitectura en Capas

```
┌─────────────────────────────────────┐
│  Capa de Presentación               │
│  - Frontend React (Vercel)          │
│  - WhatsApp Business API            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Capa de API                        │
│  - Express Routes                   │
│  - Middleware de Autenticación      │
│  - Validación de Datos              │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Capa de Lógica de Negocio          │
│  - Services (notificaciones, etc)   │
│  - Bot Flows (conversaciones)       │
│  - Reglas de Negocio                │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Capa de Acceso a Datos             │
│  - Mongoose Models                  │
│  - MongoDB Atlas                    │
└─────────────────────────────────────┘
```

---

## 🔧 Componentes del Sistema

### 1. Backend (Node.js + TypeScript)

**Ubicación:** `backend/`

#### 🤖 Bot de WhatsApp (Puerto 3008)

**Archivo principal:** `backend/src/app.ts`

- **Framework:** BuilderBot + WhatsApp Business API
- **Función:** Gestiona conversaciones con clientes vía WhatsApp

**Flujos conversacionales:**

| Flujo | Archivo | Descripción |
|-------|---------|-------------|
| Bienvenida | `flows/welcome.flow.ts` | Mensaje inicial y menú principal |
| Hogares | `flows/hogar.flow.ts` | Registro y pedidos de clientes hogar |
| Negocios | `flows/negocios.flow.ts` | Tiendas, restaurantes, mayoristas |
| Catálogo | `flows/catalogo.flow.ts` | Gestión de pedidos |
| Privacidad | `flows/privacidad.flow.ts` | RGPD/Habeas Data |
| Ubicación | `flows/ubicacion.flow.ts` | Puntos de venta |
| Recetas | `flows/recetas.flow.ts` | Recetas de cocina |
| Router | `flows/router.flow.ts` | Enrutador de flujos |

#### 🌐 API REST (Puerto 3009)

**Archivo principal:** `backend/src/server.ts`

- **Framework:** Express.js
- **Función:** API pura para el dashboard React

**Endpoints principales:**

```
Authentication:
├── POST   /api/auth/login          - Iniciar sesión
├── POST   /api/auth/logout         - Cerrar sesión
├── POST   /api/auth/refresh        - Renovar token
├── POST   /api/auth/forgot         - Recuperar contraseña
├── POST   /api/auth/reset/:token   - Resetear contraseña
└── GET    /api/auth/me             - Usuario autenticado

Clientes:
├── GET    /api/clientes            - Listar clientes
├── GET    /api/clientes/:telefono  - Obtener cliente
├── PUT    /api/clientes/:telefono  - Actualizar cliente
└── DELETE /api/clientes/:telefono  - Eliminar cliente

Pedidos:
├── GET    /api/pedidos             - Listar pedidos
└── GET    /api/pedidos/:id         - Obtener pedido

Conversaciones:
├── GET    /api/conversaciones      - Listar conversaciones
└── GET    /api/conversaciones/:tel - Obtener conversación

Eventos:
├── GET    /api/eventos             - Listar eventos
├── POST   /api/eventos             - Crear evento
├── GET    /api/eventos/:id         - Obtener evento
├── PUT    /api/eventos/:id         - Actualizar evento
└── DELETE /api/eventos/:id         - Eliminar evento

Usuarios:
├── GET    /api/usuarios            - Listar usuarios (admin)
├── POST   /api/usuarios            - Crear usuario (admin)
├── POST   /api/usuarios/bulk       - Importar CSV (admin)
├── PATCH  /api/usuarios/:id/rol    - Cambiar rol (admin)
├── PATCH  /api/usuarios/:id/estado - Activar/Desactivar (admin)
└── DELETE /api/usuarios/:id        - Eliminar usuario (admin)

Notificaciones:
├── GET    /api/notificaciones          - Obtener notificaciones
├── PATCH  /api/notificaciones/:id/leer - Marcar como leída
└── PATCH  /api/notificaciones/leer-todas - Marcar todas

Power BI:
├── GET    /api/powerbi/stats           - Estadísticas generales
├── GET    /api/powerbi/clientes        - Datos de clientes
├── GET    /api/powerbi/pedidos         - Datos de pedidos
├── GET    /api/powerbi/conversaciones  - Datos de conversaciones
├── GET    /api/powerbi/estadisticas    - Métricas avanzadas
└── GET    /api/powerbi/usuarios        - Datos de usuarios
```

### Modelos de Datos (MongoDB)

#### Usuario (`models/Usuario.ts`)

```typescript
{
  email: string
  passwordHash: string
  rol: 'administrador' | 'operador' | 'soporte' | 'hogares'
  tipoOperador?: 'coordinador_masivos' | 'director_comercial' | 
                 'ejecutivo_horecas' | 'mayorista' | null
  activo: boolean
  nombre?: string
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  refreshToken?: string
  createdAt: Date
  updatedAt: Date
}
```

#### Cliente (`models/Cliente.ts`)

```typescript
{
  telefono: string (unique)
  nombre?: string
  tipoCliente: 'hogar' | 'tienda' | 'asadero' | 
               'restaurante_estandar' | 'restaurante_premium' | 'mayorista'
  nombreNegocio?: string
  ciudad?: string
  direccion?: string
  responsable?: 'coordinador_masivos' | 'director_comercial' | 
                'ejecutivo_horecas' | 'mayorista' | 'encargado_hogares'
  personaContacto?: string
  productosInteres?: string
  politicasAceptadas?: boolean
  fechaAceptacionPoliticas?: Date
  politicasRevocadas?: boolean
  fechaRevocacion?: Date
  estado?: 'activo' | 'inactivo'
  fechaRegistro: Date
  ultimaInteraccion: Date
  conversaciones: number
}
```

#### Pedido (`models/Pedido.ts`)

```typescript
{
  idPedido: string (unique)
  telefono: string
  tipoCliente: string
  nombreNegocio?: string
  ciudad?: string
  direccion?: string
  personaContacto?: string
  productos: [{
    nombre: string
    cantidad: number
    precioUnitario: number
    subtotal: number
  }]
  total: number
  coordinadorAsignado: string
  telefonoCoordinador: string
  estado: 'pendiente' | 'en_proceso' | 'atendido' | 'cancelado'
  fechaPedido: Date
  notas?: string
  notasCancelacion?: string
  historialEstados: [{
    estado: string
    fecha: Date
    operadorEmail?: string
    operadorId?: string
    nota?: string
  }]
}
```

#### Conversacion (`models/Conversacion.ts`)

```typescript
{
  telefono: string (unique)
  mensajes: [{
    de: 'cliente' | 'bot'
    mensaje: string
    timestamp: Date
  }]
  interaccionesImportantes: [{
    tipo: 'registro' | 'pedido' | 'politicas'
    contenido: string
    timestamp: Date
  }]
  fechaUltimoMensaje: Date
}
```

#### Evento (`models/Evento.ts`)

```typescript
{
  nombre: string
  descripcion?: string
  fechaInicio: Date
  fechaFin: Date
  tipo: 'campaña' | 'promocion' | 'informativo'
  estado: 'programado' | 'enviando' | 'completado' | 'cancelado'
  destinatarios: {
    tipo: 'todos' | 'hogar' | 'negocios' | 'personalizado'
    filtros?: object
    telefonos?: string[]
  }
  mensaje: string
  estadisticas: {
    enviados: number
    entregados: number
    leidos: number
    errores: number
  }
  creadoPor: string
  createdAt: Date
  updatedAt: Date
}
```

#### Notificacion (`models/Notificacion.ts`)

```typescript
{
  tipo: 'nuevo_pedido' | 'usuario_desactivado' | 'usuario_eliminado'
  mensaje: string
  usuarioDestinoId: string
  usuarioDestinoEmail: string
  referencia?: {
    tipo: 'pedido' | 'usuario'
    id: string
  }
  leida: boolean
  createdAt: Date
}
```

### Sistema de Autenticación

**Middleware:** `middleware/auth.ts`

```typescript
// Verificar token JWT
export function verificarToken(req, res, next)

// Solo administradores
export function soloAdmin(req, res, next)

// Admin o soporte
export function adminOSoporte(req, res, next)

// Requiere ciertos roles
export function requiereRol(...roles)(req, res, next)
```

**Roles del sistema:**

| Rol | Permisos |
|-----|----------|
| `administrador` | Acceso total, gestión de usuarios |
| `operador` | Gestión de clientes y pedidos según su tipo |
| `soporte` | Lectura de datos, gestión de eventos |
| `hogares` | Gestión de clientes tipo hogar |

**Tipos de operador:**

| Tipo | Descripción |
|------|-------------|
| `coordinador_masivos` | Negocios fuera de Villavicencio |
| `director_comercial` | Tiendas y asaderos en Villavicencio |
| `ejecutivo_horecas` | Hoteles, casinos, restaurantes premium |
| `mayorista` | Distribuidoras mayoristas |
| `encargado_hogares` | Clientes hogar |

---

### 2. Frontend (React + TypeScript)

**Ubicación:** `frontend-react/`

#### Stack Tecnológico

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite (HMR, optimización)
- **Routing:** React Router v6
- **Estado:** Context API
- **HTTP Client:** Fetch API
- **Estilos:** CSS Modules
- **Puerto desarrollo:** 5173

#### Estructura de Carpetas

```
frontend-react/
├── public/
│   ├── _redirects          # Vercel redirects
│   └── assets/
│       └── images/
├── src/
│   ├── assets/             # Recursos estáticos
│   ├── components/         # Componentes reutilizables
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── NotificationBell/
│   │   │   ├── NotificationBell.tsx
│   │   │   └── NotificationBell.css
│   │   ├── HelpButton/
│   │   ├── ClienteDetalle.tsx
│   │   ├── ConversacionDetalle.tsx
│   │   ├── PedidoDetalle.tsx
│   │   ├── EventoForm.tsx
│   │   ├── ExportMenu.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── RoleGuard.tsx
│   ├── config/
│   │   └── api.ts          # Configuración API
│   ├── contexts/
│   │   └── AuthContext.tsx # Estado de autenticación
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── ResetPassword.tsx
│   │   └── dashboard/
│   │       ├── Clientes.tsx
│   │       ├── Pedidos.tsx
│   │       ├── Conversaciones.tsx
│   │       ├── Eventos.tsx
│   │       └── Usuarios.tsx
│   ├── services/           # API calls
│   │   ├── api.service.ts
│   │   ├── auth.service.ts
│   │   ├── clientes.service.ts
│   │   ├── pedidos.service.ts
│   │   ├── conversaciones.service.ts
│   │   ├── eventos.service.ts
│   │   ├── usuarios.service.ts
│   │   └── export.service.ts
│   ├── types/
│   │   └── index.ts        # TypeScript types
│   ├── utils/              # Utilidades
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts
```

#### Componentes Principales

**AuthContext** - Gestión de autenticación:

```typescript
const { user, login, logout, loading } = useAuth()
```

**ProtectedRoute** - Rutas privadas:

```typescript
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

**RoleGuard** - Control por roles:

```typescript
<RoleGuard allowedRoles={['administrador', 'soporte']}>
  <UsuariosPage />
</RoleGuard>
```

**NotificationBell** - Sistema de notificaciones:

- Consulta `/api/notificaciones` cada 10 segundos
- Muestra contador de notificaciones no leídas
- Permite marcar como leídas
- Navega a la sección correspondiente

---

### 3. Base de Datos (MongoDB Atlas)

**Configuración:**

- **Tipo:** MongoDB en la nube (Atlas)
- **ODM:** Mongoose
- **Variable de entorno:** `MONGO_URI`

**Colecciones:**

- `usuarios` - Operadores del sistema
- `clientes` - Clientes registrados
- `pedidos` - Pedidos realizados
- `conversaciones` - Mensajes WhatsApp
- `eventos` - Campañas masivas
- `notificaciones` - Notificaciones del sistema

**Índices:**

```javascript
// Cliente
{ telefono: 1 } // unique

// Pedido
{ idPedido: 1 } // unique
{ telefono: 1 }
{ fechaPedido: -1 }

// Notificacion
{ usuarioDestinoId: 1, createdAt: -1 }
{ leida: 1 }
```

---

## 🎨 Patrones de Diseño

### 1. Layered Architecture (Arquitectura en Capas)

Separación clara de responsabilidades:

```
Presentación → API → Business Logic → Data Access
```

**Implementación:**

- **Presentación:** React components, WhatsApp flows
- **API:** Express routes, middleware
- **Business Logic:** Services, bot flows
- **Data Access:** Mongoose models

---

### 2. MVC (Model-View-Controller)

**Models:** `backend/src/models/`

```typescript
// Usuario.ts
export default mongoose.model<IUsuario>('Usuario', UsuarioSchema)
```

**Views:** `frontend-react/src/pages/`

```typescript
// Clientes.tsx
export default function Clientes() {
  return <div>Lista de clientes</div>
}
```

**Controllers:** `backend/src/routes/`

```typescript
// usuarios.routes.ts
router.get('/', verificarToken, async (req, res) => {
  const usuarios = await Usuario.find()
  res.json({ data: usuarios })
})
```

---

### 3. Service Layer Pattern

Lógica de negocio en servicios reutilizables:

**`backend/src/services/notificaciones.service.ts`**

```typescript
export async function notificarNuevoPedido(
  pedidoId: string,
  tipoResponsable: string,
  nombreCliente?: string
) {
  // Lógica compleja de notificaciones
  const usuarios = await Usuario.find({ /* ... */ })
  for (const usuario of usuarios) {
    await crearNotificacion(/* ... */)
  }
}
```

**Beneficios:**

- ✅ Lógica reutilizable
- ✅ Fácil de testear
- ✅ Separación de responsabilidades

---

### 4. Repository Pattern

Modelos como repositorios de datos:

```typescript
// Usuario.ts actúa como Repository
class UsuarioRepository {
  static async find(query) {
    return Usuario.find(query)
  }
  
  static async findById(id) {
    return Usuario.findById(id)
  }
  
  static async create(data) {
    const usuario = new Usuario(data)
    return usuario.save()
  }
}
```

---

### 5. Middleware Pattern (Chain of Responsibility)

Cadena de procesamiento para requests:

```typescript
router.get('/',
  verificarToken,        // 1. Verificar autenticación
  soloAdmin,            // 2. Verificar permisos
  async (req, res) => { // 3. Handler final
    // Lógica del endpoint
  }
)
```

**Middleware de autenticación:**

```typescript
export function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Token requerido' })
  
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next() // Continuar cadena
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}
```

---

### 6. Strategy Pattern

Diferentes estrategias según tipo de cliente:

```typescript
// flows/router.flow.ts
function routeByClientType(tipoCliente) {
  if (tipoCliente === 'hogar') {
    return gotoFlow(hogarFlow)
  } else if (tipoCliente === 'mayorista') {
    return gotoFlow(negociosFlow)
  } else if (tipoCliente === 'restaurante_premium') {
    return gotoFlow(negociosFlow)
  }
  // Estrategia por defecto
  return gotoFlow(negociosFlow)
}
```

---

### 7. State Machine Pattern

El bot de WhatsApp implementa una máquina de estados:

```typescript
export const pedidoFlow = addKeyword(['pedido'])
  .addAction(async (ctx, { state, flowDynamic }) => {
    const myState = state.getMyState()
    
    // Estado: seleccionando tipo
    if (!myState.tipoCliente) {
      await flowDynamic('¿Hogar o Negocio?')
      return
    }
    
    // Estado: agregando productos
    if (!myState.finalizando) {
      await procesarProducto(ctx, state)
      return
    }
    
    // Estado: finalizando pedido
    await finalizarPedido(ctx, state)
  })
```

**Estados del pedido:**

```
inicial → tipo_cliente → catálogo → carrito → confirmación → guardado
```

---

### 8. Factory Pattern

Creación de objetos según tipo:

```typescript
// negocios.flow.ts
function obtenerResponsable(
  tipoNegocio: string, 
  ciudad?: string
): ResponsableInfo {
  
  if (tipoNegocio === 'mayorista') {
    return {
      tipo: 'mayorista',
      nombre: 'Coordinador Mayoristas',
      telefono: '3214057410'
    }
  }
  
  if (tipoNegocio === 'restaurante_premium') {
    return {
      tipo: 'ejecutivo_horecas',
      nombre: 'Ejecutivo Horecas',
      telefono: '3138479027'
    }
  }
  
  // Factory continúa según lógica de negocio...
}
```

---

### 9. Observer Pattern

Sistema de notificaciones push:

```typescript
// Evento observado
await nuevoPedido.save()

// Notificar a observadores (operadores)
await notificarNuevoPedido(
  nuevoPedido._id,
  cliente.responsable,
  cliente.nombre
)

// Los operadores reciben notificación en tiempo real
```

**Observadores:**

- Operadores del tipo correspondiente
- Administradores (para eventos de usuarios)

---

### 10. Singleton Pattern

Conexión única a la base de datos:

```typescript
// database.ts
let dbConnection = null

export async function connectDB() {
  if (!dbConnection) {
    dbConnection = await mongoose.connect(MONGO_URI)
    console.log('✅ MongoDB conectado')
  }
  return dbConnection
}
```

---

### 11. Dependency Injection

Inyección de dependencias en middleware:

```typescript
// Middleware inyecta usuario en request
router.get('/', verificarToken, async (req: AuthRequest, res) => {
  // req.user fue inyectado por verificarToken
  console.log(req.user.email)
})
```

---

### 12. Module Pattern

Organización en módulos ES6:

```typescript
// Exportación nombrada
export async function notificarNuevoPedido() { }
export async function notificarUsuarioDesactivado() { }

// Importación
import { 
  notificarNuevoPedido,
  notificarUsuarioDesactivado 
} from '../services/notificaciones.service.js'
```

---

### 13. RESTful Resource Pattern

API organizada por recursos HTTP:

```
GET    /api/clientes      → Listar todos
POST   /api/clientes      → Crear nuevo
GET    /api/clientes/:id  → Obtener uno
PUT    /api/clientes/:id  → Actualizar completo
PATCH  /api/clientes/:id  → Actualizar parcial
DELETE /api/clientes/:id  → Eliminar
```

---

### 14. Context API Pattern (React)

Estado global compartido:

```typescript
// AuthContext.tsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const login = async (email, password) => {
    const response = await authService.login(email, password)
    setUser(response.user)
  }
  
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Uso en componentes
const { user, login } = useAuth()
```

---

### 15. Higher-Order Component (HOC)

Componentes de orden superior para protección:

```typescript
// ProtectedRoute.tsx
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" />
  
  return <Outlet /> // Renderizar children
}

// Uso
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

---

### 16. Composition Pattern (React)

Componentes compuestos:

```typescript
<DashboardLayout>
  <Sidebar>
    <MenuItem icon="📊" label="Clientes" />
    <MenuItem icon="📦" label="Pedidos" />
  </Sidebar>
  
  <Header>
    <UserMenu user={user} />
    <NotificationBell />
  </Header>
  
  <MainContent>
    <Outlet /> {/* Children dinámicos */}
  </MainContent>
</DashboardLayout>
```

---

## 📊 Resumen de Patrones por Capa

| Capa | Patrones Principales |
|------|---------------------|
| **Frontend React** | Component Composition, Context API, HOC, Module |
| **API Routes** | MVC, Middleware Chain, REST, DI |
| **Services** | Service Layer, Strategy, Factory, Observer |
| **Models** | Repository, Singleton (DB), Module |
| **Bot Flows** | State Machine, Strategy, Factory |

---

## 🎯 Principios SOLID Aplicados

### Single Responsibility Principle (SRP)

Cada módulo tiene una única responsabilidad:

```typescript
// ✅ Correcto
class NotificacionService {
  async enviarNotificacion() { }
}

class UsuarioService {
  async crearUsuario() { }
}

// ❌ Incorrecto
class GodService {
  async enviarNotificacion() { }
  async crearUsuario() { }
  async procesarPedido() { }
}
```

### Open/Closed Principle (OCP)

Abierto para extensión, cerrado para modificación:

```typescript
// Extensible vía nuevos flujos sin modificar existentes
export const nuevaTiendaFlow = addKeyword(['nueva_tienda'])
  .addAction(/* ... */)
```

### Dependency Inversion Principle (DIP)

Depender de abstracciones, no de concreciones:

```typescript
// Routes dependen de abstracción (middleware)
router.get('/', verificarToken, handler)

// No importa la implementación interna de verificarToken
```

### Interface Segregation Principle (ISP)

Interfaces específicas en TypeScript:

```typescript
// ✅ Interfaces segregadas
interface IUsuario {
  email: string
  rol: string
}

interface IUsuarioConAuth extends IUsuario {
  passwordHash: string
  refreshToken?: string
}

// ❌ Interface gorda
interface IUsuarioGod {
  email: string
  rol: string
  passwordHash: string
  pedidos: IPedido[]
  conversaciones: IConversacion[]
}
```

---

## 🔄 Flujo de Comunicación

### Cliente WhatsApp → Sistema

```
1. Cliente envía mensaje WhatsApp
   ↓
2. WhatsApp Business API → Webhook
   ↓
3. Backend (Puerto 3008) recibe mensaje
   ↓
4. BuilderBot procesa con flows
   ↓
5. Ejecuta lógica de negocio
   ↓
6. Guarda datos en MongoDB
   ↓
7. Envía notificaciones a operadores
   ↓
8. Responde al cliente vía WhatsApp
```

### Operador Dashboard → Sistema

```
1. Operador accede a https://dashboard.vercel.app
   ↓
2. Frontend React carga (Puerto 5173 en dev)
   ↓
3. Usuario ingresa credenciales
   ↓
4. POST /api/auth/login
   ↓
5. Backend valida y genera JWT
   ↓
6. Frontend guarda token en localStorage
   ↓
7. Cada request incluye token en headers
   ↓
8. Middleware verificarToken valida JWT
   ↓
9. Backend consulta/modifica MongoDB
   ↓
10. Retorna JSON response
   ↓
11. Frontend actualiza UI React
```

### Sistema de Notificaciones

```
Evento disparador (nuevo pedido):
   ↓
1. await nuevoPedido.save()
   ↓
2. await notificarNuevoPedido(pedidoId, tipo, nombre)
   ↓
3. Service busca operadores según tipo
   ↓
4. Crea notificación en MongoDB
   ↓
5. Frontend consulta cada 10 segundos
   ↓
6. GET /api/notificaciones
   ↓
7. Muestra campana con contador
   ↓
8. Usuario hace clic → marca como leída
   ↓
9. PATCH /api/notificaciones/:id/leer
```

---

## 🎯 Tipos de Clientes y Responsables

Según lógica de negocio en `backend/src/flows/negocios.flow.ts`:

### Mapeo de Responsables

| Tipo de Cliente | Responsable | Nombre | Teléfono |
|----------------|-------------|--------|----------|
| **Hogar** | Encargado Hogares | Encargado Hogares | 3138479027 |
| **Mayorista** | Mayorista | Coordinador Mayoristas | 3214057410 |
| **Restaurante Premium** | Ejecutivo Horecas | Ejecutivo Horecas | 3138479027 |
| **Tienda (Villavicencio)** | Director Comercial | Director Comercial | 3108540251 |
| **Asadero (Villavicencio)** | Director Comercial | Director Comercial | 3108540251 |
| **Restaurante Estándar (Vvco)** | Director Comercial | Director Comercial | 3108540251 |
| **Negocios fuera de Vvco** | Coordinador Masivos | Coordinador de Masivos | 3232747647 |

### Lógica de Asignación

```typescript
function obtenerResponsable(tipoNegocio: string, ciudad?: string) {
  // 1. Mayoristas → siempre mayorista
  if (tipoNegocio === 'mayorista') {
    return { tipo: 'mayorista', ... }
  }
  
  // 2. Premium → Ejecutivo Horecas
  if (tipoNegocio === 'restaurante_premium') {
    return { tipo: 'ejecutivo_horecas', ... }
  }
  
  // 3. Fuera de Villavicencio → Coordinador Masivos
  const municipiosMeta = ['acacías', 'guamal', 'yopal', ...]
  if (municipiosMeta.includes(ciudad.toLowerCase())) {
    return { tipo: 'coordinador_masivos', ... }
  }
  
  // 4. Tiendas/Asaderos en Vvco → Director Comercial
  if (['tienda', 'asadero', 'restaurante_estandar'].includes(tipoNegocio)) {
    return { tipo: 'director_comercial', ... }
  }
  
  // Default
  return { tipo: 'director_comercial', ... }
}
```

---

## 🔔 Sistema de Notificaciones

Implementado en `backend/src/services/notificaciones.service.ts`

### Tipos de Notificaciones

| Tipo | Evento | Destinatarios |
|------|--------|---------------|
| `nuevo_pedido` | Cliente hace pedido | Operadores del tipo correspondiente |
| `usuario_desactivado` | Admin desactiva usuario | Todos los administradores |
| `usuario_eliminado` | Admin elimina usuario | Todos los administradores |

### Flujo de Notificación de Pedido

```typescript
// 1. Guardar pedido
await nuevoPedido.save()

// 2. Determinar responsable del cliente
const tipoResponsable = cliente.responsable || tipoCliente

// 3. Notificar
await notificarNuevoPedido(
  pedidoId,
  tipoResponsable,  // 'coordinador_masivos', 'mayorista', etc.
  nombreCliente
)

// 4. Service encuentra operadores
const usuarios = await Usuario.find({
  rol: 'operador',
  tipoOperador: tipoResponsable,
  activo: true
})

// 5. Crea notificación para cada uno
for (const usuario of usuarios) {
  await crearNotificacion(
    'nuevo_pedido',
    `Nuevo pedido de ${nombreCliente}`,
    usuario._id,
    usuario.email,
    { tipo: 'pedido', id: pedidoId }
  )
}
```

### Mapeo Tipo Cliente → Operador

```typescript
const mapeoTipoOperador = {
  'hogar': 'coordinador_masivos',
  'mayorista': 'mayorista',
  'restaurante_premium': 'ejecutivo_horecas',
  'tienda': 'director_comercial',
  'asadero': 'director_comercial',
  'restaurante_estandar': 'director_comercial'
}
```

**Nota:** Si el cliente tiene campo `responsable`, se usa directamente. Si no, se mapea desde `tipoCliente`.

### Frontend - NotificationBell

```typescript
// Consulta cada 10 segundos
useEffect(() => {
  fetchNotifications()
  const interval = setInterval(fetchNotifications, 10000)
  return () => clearInterval(interval)
}, [user])

// Muestra contador
const unreadCount = notifications.filter(n => !n.leida).length

// Click en notificación
const handleClick = async (notification) => {
  // Marcar como leída
  await fetch(`/api/notificaciones/${notification._id}/leer`, {
    method: 'PATCH'
  })
  
  // Navegar según tipo
  if (notification.tipo === 'nuevo_pedido') {
    navigate('/dashboard/pedidos')
  } else {
    navigate('/dashboard/usuarios')
  }
}
```

---

## 🔐 Seguridad

### Autenticación JWT

```typescript
// Login genera tokens
const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' })

// Refresh renovar access token
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body
  const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET)
  const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
  res.json({ accessToken: newAccessToken })
})
```

### Protección de Contraseñas

```typescript
// Hash con bcrypt (salt rounds: 10)
const passwordHash = await bcrypt.hash(password, 10)

// Validación
const isValid = await bcrypt.compare(passwordInput, passwordHash)
```

### CORS

```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'https://tu-frontend.vercel.app'
]

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('CORS no permitido'))
    }
  },
  credentials: true
}))
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests
})

app.use('/api/', limiter)
```

### Validación de Roles

```typescript
// Middleware personalizado
export function requiereRol(...rolesPermitidos: RolUsuario[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' })
    }
    
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Permiso denegado' })
    }
    
    next()
  }
}

// Uso
router.delete('/:id', 
  verificarToken,
  requiereRol('administrador'),
  async (req, res) => {
    // Solo administradores
  }
)
```

---

## 📦 Despliegue

### Desarrollo Local

```bash
# Terminal 1 - Backend API
cd backend
npm install
cp .env.example .env
# Configurar variables de entorno
npm run dev:dashboard  # Puerto 3009

# Terminal 2 - Bot WhatsApp (opcional)
cd backend
npm run dev            # Puerto 3008

# Terminal 3 - Frontend
cd frontend-react
npm install
npm run dev            # Puerto 5173
```

### Variables de Entorno Requeridas

**Backend (.env):**

```env
# MongoDB
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/chatbot

# JWT
JWT_SECRET=tu_secreto_super_seguro_aqui
JWT_REFRESH_SECRET=otro_secreto_para_refresh

# WhatsApp
WHATSAPP_TOKEN=tu_token_meta_business_api
WHATSAPP_VERIFY_TOKEN=tu_verify_token

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://tu-frontend.vercel.app

# Email (SendGrid)
SENDGRID_API_KEY=tu_api_key_sendgrid
FROM_EMAIL=noreply@tudominio.com

# Puerto
PORT=3009
```

**Frontend (.env):**

```env
VITE_API_URL=http://localhost:3009/api
# Producción: https://tu-backend.railway.app/api
```

### Producción

**Frontend - Vercel:**

1. Conectar repositorio GitHub
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`
5. Variables de entorno: `VITE_API_URL`

**Backend - Railway:**

1. Conectar repositorio GitHub
2. Root directory: `backend`
3. Build command: `npm run build:server`
4. Start command: `npm start`
5. Variables de entorno: Todas las del `.env`

**Base de Datos - MongoDB Atlas:**

1. Crear cluster gratuito
2. Configurar IP whitelist (0.0.0.0/0 para permitir todas)
3. Obtener connection string
4. Configurar en `MONGO_URI`

---

## 📊 Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE FINAL                             │
│                     (WhatsApp / Dashboard)                       │
└───────────────────┬─────────────────────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
    ┌────▼─────┐         ┌────▼─────┐
    │ WhatsApp │         │ Browser  │
    │   API    │         │  React   │
    └────┬─────┘         └────┬─────┘
         │                    │
         │                    │ HTTPS
         │                    │
    ┌────▼─────────────────────▼─────┐
    │      Backend Node.js            │
    │  ┌──────────┐  ┌──────────┐    │
    │  │   Bot    │  │   API    │    │
    │  │  :3008   │  │  :3009   │    │
    │  └────┬─────┘  └────┬─────┘    │
    │       │             │           │
    │       └──────┬──────┘           │
    │              │                  │
    │    ┌─────────▼──────────┐      │
    │    │   Business Logic    │      │
    │    │   - Flows           │      │
    │    │   - Services        │      │
    │    │   - Middleware      │      │
    │    └─────────┬──────────┘      │
    │              │                  │
    │    ┌─────────▼──────────┐      │
    │    │   Data Access       │      │
    │    │   - Models          │      │
    │    │   - Mongoose        │      │
    │    └─────────┬──────────┘      │
    └──────────────┼──────────────────┘
                   │
         ┌─────────▼──────────┐
         │   MongoDB Atlas     │
         │                     │
         │   Collections:      │
         │   - usuarios        │
         │   - clientes        │
         │   - pedidos         │
         │   - conversaciones  │
         │   - eventos         │
         │   - notificaciones  │
         └─────────────────────┘
```

---

## 🎓 Conclusión

Este proyecto implementa una **arquitectura moderna, escalable y mantenible** utilizando:

✅ **Separación de responsabilidades** clara con arquitectura en capas  
✅ **Patrones de diseño** probados (MVC, Service Layer, Repository, Observer, etc.)  
✅ **Principios SOLID** para código limpio y extensible  
✅ **Tipado fuerte** con TypeScript en todo el stack  
✅ **Seguridad robusta** con JWT, bcrypt, CORS, rate limiting  
✅ **Sistema de notificaciones** inteligente y en tiempo real  
✅ **API RESTful** bien estructurada  
✅ **Frontend moderno** con React + Vite  
✅ **Base de datos** escalable en la nube (MongoDB Atlas)  
✅ **Despliegue** flexible en Vercel + Railway  

---

**Desarrollado con** ❤️ **para Avellano - "Alimentar es amar"**

---

## 📚 Referencias y Documentación

- [BuilderBot Documentation](https://builderbot.vercel.app/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

---

**Última actualización:** 11 de diciembre de 2025
