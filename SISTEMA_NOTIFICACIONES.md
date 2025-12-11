# Sistema de Notificaciones Inteligentes

## 📋 Resumen

Se implementó un sistema completo de notificaciones que notifica automáticamente a los usuarios correspondientes según eventos específicos del sistema.

## 🎯 Funcionalidades Implementadas

### 1. **Notificaciones de Pedidos Nuevos** 📦

Cuando un cliente hace un pedido a través del chatbot de WhatsApp, el sistema:

- Identifica el tipo de cliente (hogar, mayorista, horeca, masivos, comercial)
- Notifica automáticamente al operador correspondiente según este mapeo:
  - **Cliente Hogar** → Usuario con rol `hogares`
  - **Cliente Mayorista** → Operador con tipo `mayorista`
  - **Cliente Horeca** → Operador con tipo `ejecutivo_horecas`
  - **Cliente Masivos** → Operador con tipo `coordinador_masivos`
  - **Cliente Comercial** → Operador con tipo `director_comercial`

**Ejemplo de notificación:**
```
📦 "Nuevo pedido de Restaurante El Buen Sabor (horeca)"
```

### 2. **Notificaciones de Usuarios Desactivados** ⚠️

Cuando un administrador desactiva un usuario:

- Se notifica a **TODOS los administradores activos** del sistema
- Incluye el nombre y email del usuario desactivado

**Ejemplo de notificación:**
```
⚠️ "Usuario Juan Pérez (juan@avellano.com) ha sido desactivado"
```

### 3. **Notificaciones de Usuarios Eliminados** 🗑️

Cuando un administrador elimina un usuario:

- Se notifica a **TODOS los administradores activos** del sistema
- Incluye el nombre y email del usuario eliminado

**Ejemplo de notificación:**
```
🗑️ "Usuario María García (maria@avellano.com) ha sido eliminado"
```

## 🏗️ Arquitectura Implementada

### Backend

#### 1. **Modelo de Notificaciones** (`backend/src/models/Notificacion.ts`)

```typescript
{
  tipo: 'nuevo_pedido' | 'usuario_desactivado' | 'usuario_eliminado',
  mensaje: string,
  usuarioDestinoId: string,
  usuarioDestinoEmail: string,
  referencia?: {
    tipo: 'pedido' | 'usuario',
    id: string
  },
  leida: boolean,
  createdAt: Date
}
```

#### 2. **Servicio de Notificaciones** (`backend/src/services/notificaciones.service.ts`)

Funciones principales:
- `crearNotificacion()` - Crea una notificación individual
- `notificarNuevoPedido()` - Notifica nuevo pedido a operadores
- `notificarUsuarioDesactivado()` - Notifica a administradores
- `notificarUsuarioEliminado()` - Notifica a administradores
- `obtenerNotificacionesUsuario()` - Obtiene notificaciones de un usuario
- `marcarComoLeida()` - Marca una notificación como leída
- `marcarTodasComoLeidas()` - Marca todas las notificaciones como leídas

#### 3. **Rutas de Notificaciones** (`backend/src/routes/notificaciones.routes.ts`)

- `GET /notificaciones` - Obtener notificaciones del usuario autenticado
- `PATCH /notificaciones/:id/leer` - Marcar una notificación como leída
- `PATCH /notificaciones/leer-todas` - Marcar todas como leídas

#### 4. **Integración en Flujos**

**Pedidos** (`backend/src/flows/catalogo.flow.ts`):
- Se agregó la llamada a `notificarNuevoPedido()` después de guardar un pedido

**Usuarios** (`backend/src/routes/usuarios.routes.ts`):
- Se agregó la llamada a `notificarUsuarioDesactivado()` al desactivar
- Se agregó la llamada a `notificarUsuarioEliminado()` al eliminar

### Frontend

#### **Componente NotificationBell** (`frontend-react/src/components/NotificationBell/NotificationBell.tsx`)

**Características:**
- Consulta notificaciones desde el backend cada 10 segundos
- Muestra un contador de notificaciones no leídas
- Permite marcar notificaciones como leídas al hacer clic
- Permite marcar todas las notificaciones como leídas
- Navega automáticamente a la sección correspondiente al hacer clic:
  - Notificación de pedido → `/dashboard/pedidos`
  - Notificación de usuario → `/dashboard/usuarios`

## 🔍 Mapeo Tipo Cliente → Tipo Operador

```javascript
{
  'hogar': 'hogares',              // Rol especial
  'mayorista': 'mayorista',
  'horeca': 'ejecutivo_horecas',
  'masivos': 'coordinador_masivos',
  'comercial': 'director_comercial'
}
```

## 🚀 Flujo de Trabajo

### Escenario 1: Nuevo Pedido Mayorista

1. Cliente mayorista hace un pedido en WhatsApp
2. El sistema guarda el pedido en la base de datos
3. `notificarNuevoPedido()` busca todos los operadores con `tipoOperador: 'mayorista'` activos
4. Crea una notificación para cada uno
5. Los operadores mayoristas ven la notificación en el frontend
6. Al hacer clic, son redirigidos a `/dashboard/pedidos`

### Escenario 2: Admin Desactiva Usuario

1. Admin desactiva un usuario desde el panel
2. Sistema actualiza el estado del usuario
3. `notificarUsuarioDesactivado()` busca todos los administradores activos
4. Crea una notificación para cada administrador
5. Todos los admins ven la notificación
6. Al hacer clic, son redirigidos a `/dashboard/usuarios`

## 📝 Características Adicionales

- **Resiliencia**: Si falla el envío de notificaciones, no falla la operación principal
- **Solo usuarios activos**: Solo reciben notificaciones usuarios con `activo: true`
- **Historial**: Se mantienen las últimas 50 notificaciones por usuario
- **Tiempo real**: Actualización cada 10 segundos en el frontend
- **Visual**: Indicadores visuales de notificaciones no leídas

## 🔐 Seguridad

- Todas las rutas requieren autenticación con JWT
- Los usuarios solo pueden ver sus propias notificaciones
- Las notificaciones se crean en el backend, no pueden ser manipuladas desde el frontend

## 📊 Tabla de Notificaciones

| Evento | Destinatarios | Tipo | Navegación |
|--------|--------------|------|------------|
| Nuevo pedido hogar | Usuarios rol `hogares` | `nuevo_pedido` | Pedidos |
| Nuevo pedido mayorista | Operadores `mayorista` | `nuevo_pedido` | Pedidos |
| Nuevo pedido horeca | Operadores `ejecutivo_horecas` | `nuevo_pedido` | Pedidos |
| Nuevo pedido masivos | Operadores `coordinador_masivos` | `nuevo_pedido` | Pedidos |
| Nuevo pedido comercial | Operadores `director_comercial` | `nuevo_pedido` | Pedidos |
| Usuario desactivado | Todos los administradores | `usuario_desactivado` | Usuarios |
| Usuario eliminado | Todos los administradores | `usuario_eliminado` | Usuarios |

## 🧪 Pruebas Recomendadas

1. **Crear un pedido mayorista** en WhatsApp → Verificar que operadores mayoristas reciban notificación
2. **Crear un pedido hogar** en WhatsApp → Verificar que usuarios rol hogares reciban notificación
3. **Desactivar un usuario** → Verificar que administradores reciban notificación
4. **Eliminar un usuario** → Verificar que administradores reciban notificación
5. **Marcar como leída** → Verificar que la notificación cambie de estado
6. **Marcar todas como leídas** → Verificar que todas cambien de estado

## 📁 Archivos Modificados/Creados

### Backend
- ✅ `backend/src/models/Notificacion.ts` (NUEVO)
- ✅ `backend/src/services/notificaciones.service.ts` (NUEVO)
- ✅ `backend/src/routes/notificaciones.routes.ts` (NUEVO)
- ✅ `backend/src/routes/index.ts` (MODIFICADO)
- ✅ `backend/src/routes/usuarios.routes.ts` (MODIFICADO)
- ✅ `backend/src/flows/catalogo.flow.ts` (MODIFICADO)

### Frontend
- ✅ `frontend-react/src/components/NotificationBell/NotificationBell.tsx` (MODIFICADO)
