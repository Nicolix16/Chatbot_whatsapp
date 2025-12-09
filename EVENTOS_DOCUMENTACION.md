# Funcionalidad de Eventos - Panel de Administrador

## 📧 Descripción General

La funcionalidad de **Eventos** permite a los administradores y personal de soporte crear y enviar mensajes masivos a través del chatbot de WhatsApp a grupos específicos de clientes registrados.

## 🎯 Características Principales

### 1. **Creación de Eventos**
- Nombre del evento para identificación interna
- Mensaje personalizable con soporte para emojis y saltos de línea
- Opción para adjuntar imágenes (funcionalidad preparada para futuro)

### 2. **Segmentación de Destinatarios**

Los eventos pueden enviarse a diferentes grupos de clientes con **selección múltiple**:

#### 📢 **Todos los Clientes**
Envía el mensaje a todos los clientes registrados en el chatbot.

#### 🏠 **Clientes Hogar**
Envía solo a clientes residenciales (tipo hogar).

#### 📍 **Por Ciudad**
Filtra clientes según su ubicación geográfica:
- Villavicencio
- Acacías
- Granada
- San Martín
- Puerto López

✅ **Puedes seleccionar múltiples ciudades** marcando varias casillas.
✅ Botón "Seleccionar todas" para marcar/desmarcar todas las ciudades.

#### 🏢 **Por Tipo de Negocio**
Segmenta clientes según su tipo:
- 🏪 **Tiendas**: Tiendas de barrio
- 🍗 **Asaderos**: Negocios de asadero
- 🍽️ **Restaurantes Estándar**: Restaurantes regulares
- ⭐ **Restaurantes Premium**: Restaurantes de alta categoría
- 📦 **Mayoristas**: Distribuidores mayoristas

✅ **Puedes seleccionar múltiples tipos** marcando varias casillas.
✅ Botón "Seleccionar todos" para marcar/desmarcar todos los tipos.

#### 🎯 **Personalizado**
Combina filtros de ciudad y tipo de negocio para una segmentación más específica.

✅ **Selecciona múltiples ciudades Y múltiples tipos** simultáneamente.
✅ Los clientes que cumplan AMBOS criterios recibirán el mensaje.
✅ Botones "Todas" para cada sección.

### 3. **Vista Previa y Confirmación**
- Contador de destinatarios en tiempo real
- Muestra cuántos clientes recibirán el mensaje antes de enviarlo

### 4. **Historial de Eventos**
- Lista de todos los eventos creados
- Información de:
  - Nombre del evento
  - Extracto del mensaje
  - Total de destinatarios
  - Cantidad enviada
  - Estado (Borrador, Enviando, Enviado, Error)
  - Fecha de creación

## 🚀 Cómo Usar

### Crear un Nuevo Evento

1. **Acceder a la sección Eventos**
   - Clic en el botón "📧 Eventos" en el sidebar del panel

2. **Crear Evento**
   - Clic en "+ Crear Evento"

3. **Completar el formulario**
   - **Nombre del Evento**: Ej: "Promoción Navideña 2025"
   - **Mensaje**: Escribe el mensaje que se enviará
   - **Imagen** (opcional): Selecciona una imagen para adjuntar

4. **Seleccionar Destinatarios**
   - Elige el tipo de segmentación
   - Selecciona ciudades, tipos de negocio o ambos
   - Verifica el contador de destinatarios

5. **Enviar**
   - Clic en "Guardar y Enviar"
   - El evento se creará y enviará inmediatamente

### Gestionar Eventos

- **Ver detalle**: Clic en el ícono 👁️
- **Eliminar** (solo borradores): Clic en el ícono 🗑️
- **Buscar**: Usa la barra de búsqueda para filtrar eventos

## 🔒 Permisos

### Quién puede usar Eventos:
- ✅ **Administrador**: Acceso completo
- ✅ **Soporte**: Acceso completo
- ❌ **Operador**: Sin acceso

## 📊 Modelo de Datos

Cada evento se almacena con:
```typescript
{
  nombre: string              // Nombre del evento
  mensaje: string            // Contenido del mensaje
  imagenUrl?: string         // URL de la imagen (futuro)
  filtros: {                 // Criterios de segmentación
    tipo: 'todos' | 'ciudad' | 'tipo' | 'personalizado'
    ciudades?: string[]
    tiposCliente?: string[]
  }
  destinatarios: {          // Información de destinatarios
    total: number
    enviados: number
    fallidos: number
    lista: Array<{
      telefono: string
      nombreNegocio?: string
      ciudad?: string
      tipoCliente: string
      enviado: boolean
      fechaEnvio?: Date
      error?: string
    }>
  }
  estado: 'borrador' | 'enviando' | 'enviado' | 'error'
  fechaCreacion: Date
  fechaEnvio?: Date
  creadoPor: string         // Email del usuario que creó
}
```

## 🔌 API Endpoints

### GET `/api/eventos`
Obtiene la lista de todos los eventos.

**Respuesta:**
```json
{
  "success": true,
  "data": [...]
}
```

### GET `/api/eventos/:id`
Obtiene un evento específico por ID.

### POST `/api/eventos`
Crea y envía un nuevo evento.

**Body:**
```json
{
  "nombre": "Promoción Navideña",
  "mensaje": "🎄 ¡Oferta especial de Navidad!...",
  "filtros": {
    "tipo": "ciudad",
    "ciudades": ["Villavicencio", "Acacías"]
  }
}
```

### DELETE `/api/eventos/:id`
Elimina un evento (solo si está en estado borrador).

## 🛠️ Archivos Modificados

### Frontend
- `public/index.html`: Sección HTML de eventos
- `public/app.js`: Lógica JavaScript para eventos
- `public/styles-sidebar.css`: Estilos del formulario

### Backend
- `src/models/Evento.ts`: Modelo de datos
- `src/server.ts`: Rutas API para eventos

## 📝 Notas Técnicas

### Integración con WhatsApp
Actualmente, el sistema marca los mensajes como "enviados" de manera simulada. Para la integración real con el bot de WhatsApp, se debe:

1. Importar el provider del bot en `server.ts`
2. En la ruta POST `/api/eventos`, después de crear el evento:
   ```typescript
   // Enviar mensajes a través del bot
   for (const destinatario of destinatarios) {
     try {
       await provider.sendText(
         destinatario.telefono,
         mensaje
       )
       // Marcar como enviado en el evento
     } catch (error) {
       // Registrar error
     }
   }
   ```

### Soporte de Imágenes
La funcionalidad está preparada para soportar imágenes. Para implementarlo:

1. Instalar `multer`: `npm install multer @types/multer`
2. Configurar almacenamiento de archivos
3. Actualizar la ruta POST para procesar archivos
4. Usar `provider.sendImage()` en lugar de `sendText()`

## 🎨 Mejoras Futuras

- [ ] Programar eventos para envío futuro
- [ ] Plantillas de mensajes predefinidas
- [ ] Estadísticas de apertura/interacción
- [ ] Exportar lista de destinatarios
- [ ] Reenviar eventos anteriores
- [ ] Adjuntar archivos PDF
- [ ] Vista previa del mensaje antes de enviar
- [ ] Envío en lotes para evitar bloqueos de WhatsApp
