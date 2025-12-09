# 📖 Manual de Usuario - Sistema Chatbot Avellano

## 📋 Índice

1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Navegación del Dashboard](#navegación-del-dashboard)
4. [Gestión de Clientes](#gestión-de-clientes)
5. [Gestión de Pedidos](#gestión-de-pedidos)
6. [Conversaciones](#conversaciones)
7. [Eventos (Admin y Soporte)](#eventos-admin-y-soporte)
8. [Gestión de Usuarios (Solo Admin)](#gestión-de-usuarios-solo-admin)
9. [Roles y Permisos](#roles-y-permisos)
10. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## 🎯 Introducción

### ¿Qué es el Sistema Chatbot Avellano?

El Sistema Chatbot Avellano es una plataforma integral que combina:
- **Chatbot de WhatsApp**: Atiende automáticamente a clientes 24/7
- **Dashboard Administrativo**: Panel web para gestionar clientes, pedidos y conversaciones

### ¿Para quién es este sistema?

- **Administradores**: Control total del sistema
- **Operadores**: Gestión de pedidos según su zona/tipo
- **Soporte**: Visualización y soporte a clientes

---

## 🔐 Acceso al Sistema

### Primer Acceso

1. **Abrir el Dashboard**
   - URL: `https://tu-dominio.vercel.app/login.html`
   - O en local: `http://localhost:3009/login.html`

2. **Iniciar Sesión**
   - Ingresa tu email corporativo
   - Ingresa tu contraseña
   - Haz clic en "Iniciar Sesión"

![Pantalla de Login](assets/login-screenshot.png)

### ¿Olvidaste tu contraseña?

1. En la pantalla de login, haz clic en **"¿Olvidó su contraseña?"**
2. Ingresa tu email registrado
3. Haz clic en **"Enviar enlace de recuperación"**
4. Revisa tu bandeja de entrada (y spam)
5. Haz clic en el botón del email
6. Crea tu nueva contraseña
7. Inicia sesión con la nueva contraseña

---

## 🧭 Navegación del Dashboard

### Barra Lateral (Sidebar)

El sidebar izquierdo contiene:

- **🏠 Dashboard**: Vista general con estadísticas
- **👥 Clientes**: Lista de todos los clientes registrados
- **📦 Pedidos**: Gestión de pedidos
- **💬 Conversaciones**: Historial de chats
- **📧 Eventos**: Envío de mensajes masivos *(Solo Admin/Soporte)*
- **👤 Usuarios**: Gestión de usuarios del sistema *(Solo Admin)*

### Tarjeta de Usuario

En la parte superior del sidebar verás:
- **Avatar**: Primera letra de tu nombre
- **Nombre**: Tu nombre completo
- **Email**: Tu correo electrónico
- **Rol**: Tu rol y tipo de operador (si aplica)

**Ejemplo de roles:**
- `ADMINISTRADOR`
- `OPERADOR - COORDINADOR MASIVOS`
- `SOPORTE`

### Cerrar Sesión

Haz clic en el botón **"Cerrar Sesión"** en la parte inferior del sidebar.

---

## 👥 Gestión de Clientes

### Ver Clientes

1. Haz clic en **"👥 Clientes"** en el sidebar
2. Verás una tabla con todos los clientes registrados

**Información mostrada:**
- Teléfono
- Nombre
- Tipo de cliente (Hogar / Negocios)
- Tipo de negocio (si aplica)
- Ciudad
- Última interacción

### Buscar un Cliente

1. Usa el campo **"🔍 Buscar cliente..."** en la parte superior
2. Puedes buscar por:
   - Nombre
   - Teléfono
   - Ciudad
   - Tipo de negocio

### Ver Detalle de un Cliente

1. Localiza el cliente en la tabla
2. Haz clic en el botón **"Ver conversación"**
3. Se abrirá un modal con:
   - Datos completos del cliente
   - Historial de conversaciones
   - Opción para contactar por WhatsApp

### Contactar un Cliente

En el modal de detalle:
1. Edita el mensaje en el campo de texto
2. Haz clic en **"📋 Copiar mensaje"** para copiar al portapapeles
3. O haz clic en **"💬 Abrir WhatsApp"** para abrir WhatsApp Web directamente

---

## 📦 Gestión de Pedidos

### Ver Pedidos

1. Haz clic en **"📦 Pedidos"** en el sidebar
2. Verás todos los pedidos según tu rol

**Filtrado por Rol:**
- **Administrador**: Ve todos los pedidos
- **Operadores**: Solo ven pedidos de su zona/tipo asignado
- **Soporte**: Ve todos los pedidos (solo lectura)

### Información de Pedidos

Cada pedido muestra:
- **Cliente**: Nombre y teléfono
- **Productos**: Lista de productos solicitados
- **Estado**: Pendiente / En proceso / Completado / Cancelado
- **Fecha**: Cuándo se realizó el pedido
- **Coordinador**: Quién está asignado
- **Dirección de entrega**

### Buscar Pedidos

Usa el campo de búsqueda para filtrar por:
- Nombre del cliente
- Teléfono
- Estado del pedido
- Productos

### Estados de Pedidos

| Estado | Significado |
|--------|-------------|
| 🟡 Pendiente | Pedido recién recibido |
| 🔵 En proceso | Pedido en preparación/entrega |
| 🟢 Completado | Pedido entregado |
| 🔴 Cancelado | Pedido cancelado |

---

## 💬 Conversaciones

### Ver Conversaciones

1. Haz clic en **"💬 Conversaciones"** en el sidebar
2. Verás el historial de todas las interacciones

**Información mostrada:**
- Cliente (nombre y teléfono)
- Último mensaje
- Fecha y hora
- Cantidad de mensajes

### Buscar Conversaciones

Filtra conversaciones por:
- Nombre del cliente
- Teléfono
- Contenido del mensaje

### Ver Detalle de Conversación

1. Haz clic en el botón **"Ver detalles"**
2. Se mostrará el historial completo de mensajes
3. Puedes ver:
   - Mensajes del cliente
   - Respuestas del bot
   - Fecha y hora de cada mensaje

---

## 📧 Eventos (Admin y Soporte)

### ¿Qué son los Eventos?

Los eventos permiten enviar mensajes masivos a grupos específicos de clientes vía WhatsApp.

**Acceso:**
- ✅ Administrador
- ✅ Soporte
- ❌ Operadores

### Crear un Nuevo Evento

1. Haz clic en **"📧 Eventos"** en el sidebar
2. Haz clic en **"+ Crear Evento"**
3. Completa el formulario:

#### Paso 1: Información Básica
- **Nombre del Evento**: Ej: "Promoción Navideña 2025"
- **Mensaje**: Escribe el mensaje que se enviará

**💡 Consejos para el mensaje:**
- Usa emojis para hacerlo más atractivo
- Sé claro y conciso
- Incluye llamado a la acción
- Usa saltos de línea para mejor lectura

**Ejemplo de mensaje:**
```
🎄 ¡OFERTA NAVIDEÑA! 🎄

Celebra con nosotros esta Navidad
✨ 20% de descuento en todos los productos
📦 Envío GRATIS en pedidos mayores a $50.000

Válido hasta el 25 de diciembre
¡Haz tu pedido ya! 🎁
```

#### Paso 2: Segmentación

**Por Tipo de Negocio:**
```
☑️ Tiendas
☑️ Restaurantes
☑️ Asaderos
☑️ Distribuidoras
☑️ Hoteles
☑️ Cafeterías
```

**Por Ciudad:**
```
☑️ Villavicencio
☑️ Acacías
☑️ Granada
☑️ San Martín
☑️ Cumaral
☑️ Restrepo
```

#### Paso 3: Vista Previa

Antes de enviar, verás:
- **Destinatarios totales**: Cuántas personas recibirán el mensaje
- **Segmentación aplicada**: Filtros activos
- **Vista previa del mensaje**

#### Paso 4: Envío

1. Revisa toda la información
2. Haz clic en **"Guardar y Enviar"**
3. Confirma el envío
4. El sistema enviará el mensaje a todos los destinatarios

### Gestionar Eventos

En la sección de eventos verás:

**Eventos Enviados:**
- Nombre del evento
- Fecha de envío
- Cantidad de destinatarios
- Estado (Enviado)

**Eventos Programados:**
- Nombre del evento
- Fecha programada
- Destinatarios
- Opción para cancelar

### Eliminar un Evento

1. Localiza el evento en la lista
2. Haz clic en el botón **"🗑️ Eliminar"**
3. Confirma la eliminación

---

## 👤 Gestión de Usuarios (Solo Admin)

### Ver Usuarios

1. Haz clic en **"👤 Usuarios"** en el sidebar
2. Verás la lista de todos los usuarios del sistema

**Información mostrada:**
- Nombre
- Email
- Rol
- Estado (Activo/Inactivo)
- Fecha de creación

### Crear Nuevo Usuario

Hay dos formas de crear usuarios:

#### Método 1: Usuario Individual

1. Haz clic en **"+ Agregar Usuario"**
2. Selecciona **"Individual"**
3. Completa el formulario:
   - **Nombre**: Nombre completo
   - **Email**: Email corporativo
   - **Contraseña**: Mínimo 6 caracteres
   - **Rol**: Selecciona el rol apropiado

**Roles disponibles:**
- Administrador
- Soporte
- Mayorista
- Director Comercial
- Coordinador de Masivos
- Ejecutivo Horecas

4. Haz clic en **"Crear Usuario"**

#### Método 2: Importación Masiva (CSV)

1. Haz clic en **"+ Agregar Usuario"**
2. Selecciona **"Importar CSV"**
3. Prepara tu archivo CSV con este formato:

```csv
nombre,email,password,rol
Juan Pérez,juan@avellano.com,password123,mayorista
María López,maria@avellano.com,password456,soporte
Carlos Gómez,carlos@avellano.com,password789,coordinador_masivos
```

**Roles válidos para CSV:**
- `administrador`
- `soporte`
- `mayorista`
- `director_comercial`
- `coordinador_masivos`
- `ejecutivo_horecas`

4. Haz clic en **"Seleccionar archivo CSV"**
5. Selecciona tu archivo
6. Revisa la vista previa
7. Haz clic en **"Importar Usuarios"**

### Cambiar Rol de Usuario

1. Localiza el usuario en la tabla
2. En la columna **"Rol"**, selecciona el nuevo rol del menú desplegable
3. Confirma el cambio
4. El rol se actualizará inmediatamente

### Activar/Desactivar Usuario

1. Localiza el usuario en la tabla
2. En la columna **"Estado"**, haz clic en el toggle
3. Confirma la acción

**Importante:**
- Usuarios inactivos no pueden iniciar sesión
- Los datos del usuario se conservan
- Puedes reactivarlo en cualquier momento

### Eliminar Usuario

1. Localiza el usuario en la tabla
2. Haz clic en el botón **"🗑️ Eliminar"**
3. Confirma la eliminación

**⚠️ Advertencia:**
- Esta acción es **irreversible**
- Se eliminarán todos los datos del usuario
- No se pueden eliminar administradores desde la UI

### Buscar Usuarios

Usa el campo **"🔍 Buscar usuario..."** para filtrar por:
- Nombre
- Email
- Rol

---

## 🔒 Roles y Permisos

### Tipos de Roles

#### 1. Administrador
**Permisos completos:**
- ✅ Ver, crear, editar y eliminar usuarios
- ✅ Ver todos los pedidos
- ✅ Ver todas las conversaciones
- ✅ Ver todos los clientes
- ✅ Crear y enviar eventos
- ✅ Acceso a todas las estadísticas

#### 2. Operador
**Permisos según zona:**
- ✅ Ver pedidos de su zona asignada
- ✅ Ver clientes de su zona
- ✅ Ver conversaciones
- ❌ No puede gestionar usuarios
- ❌ No puede crear eventos

**Tipos de Operadores:**

##### Coordinador de Masivos
- **Zona**: Municipios del Meta (Acacías, Cumaral, Restrepo, etc.)
- **Clientes**: Tiendas, distribuidoras, asaderos fuera de Villavicencio
- Ve solo pedidos donde `coordinadorAsignado = "Coordinador de Masivos"`

##### Director Comercial
- **Zona**: Villavicencio
- **Tipo**: Tiendas, asaderos, restaurantes
- Ve solo pedidos donde `coordinadorAsignado = "Director Comercial"`

##### Ejecutivo Horecas
- **Zona**: Villavicencio
- **Tipo**: Hoteles, restaurantes, cafeterías
- Ve solo pedidos donde `coordinadorAsignado = "Ejecutivo Horecas"`

##### Coordinador Mayoristas
- **Tipo**: Clientes mayoristas
- **Zona**: Todas
- Ve solo pedidos donde `coordinadorAsignado = "Coordinador de Mayoristas"`

#### 3. Soporte
**Solo lectura:**
- ✅ Ver clientes (datos básicos)
- ✅ Ver todas las conversaciones
- ✅ Ver todos los pedidos
- ✅ Crear y enviar eventos
- ❌ No puede gestionar usuarios
- ❌ No tiene permisos de escritura (POST/PUT/DELETE)

### Matriz de Permisos

| Funcionalidad | Administrador | Operador | Soporte |
|--------------|---------------|----------|---------|
| Ver Dashboard | ✅ | ✅ | ✅ |
| Ver todos los clientes | ✅ | ❌ (solo su zona) | ✅ |
| Ver todos los pedidos | ✅ | ❌ (solo su zona) | ✅ |
| Ver conversaciones | ✅ | ✅ | ✅ |
| Crear eventos | ✅ | ❌ | ✅ |
| Gestionar usuarios | ✅ | ❌ | ❌ |
| Editar datos | ✅ | ✅ (limitado) | ❌ |

### Diferencias Visuales por Rol

**Badge de Rol:**
- **Administrador**: 🔴 Rojo
- **Operador**: 🔵 Turquesa (+ tipo de operador)
- **Soporte**: 🟢 Verde claro

**Tabs visibles:**
- **Operadores**: No ven "Eventos" ni "Usuarios"
- **Soporte**: No ven "Usuarios"
- **Admin**: Ven todos los tabs

---

## ❓ Preguntas Frecuentes

### Acceso y Cuenta

**P: ¿Cómo obtengo mi usuario y contraseña?**  
R: Tu administrador debe crear tu cuenta y proporcionarte las credenciales.

**P: ¿Puedo cambiar mi contraseña?**  
R: Sí, usa la opción "¿Olvidó su contraseña?" en el login o solicita al administrador que la restablezca.

**P: ¿Puedo usar mi cuenta en varios dispositivos?**  
R: Sí, puedes iniciar sesión desde cualquier dispositivo, pero se cerrará la sesión anterior.

**P: ¿Cuánto tiempo dura mi sesión?**  
R: Por seguridad, las sesiones expiran después de 24 horas de inactividad.

### Clientes y Pedidos

**P: ¿Por qué no veo todos los pedidos?**  
R: Dependiendo de tu rol, solo verás los pedidos de tu zona/tipo asignado. Los administradores ven todos.

**P: ¿Cómo actualizo la información de un cliente?**  
R: Actualmente, la información se actualiza automáticamente cuando el cliente interactúa con el bot. Los cambios manuales solo pueden hacerlos administradores.

**P: ¿Puedo exportar la lista de clientes?**  
R: Esta funcionalidad está en desarrollo. Por ahora, contacta a tu administrador.

**P: ¿Qué significa cada estado de pedido?**  
R: Ver la tabla de [Estados de Pedidos](#estados-de-pedidos) en este manual.

### Eventos

**P: ¿Cuántos eventos puedo enviar por día?**  
R: No hay límite en el sistema, pero considera las mejores prácticas de comunicación para no saturar a los clientes.

**P: ¿Puedo programar un evento para enviarse después?**  
R: Esta funcionalidad está en desarrollo. Actualmente, los eventos se envían inmediatamente.

**P: ¿Puedo adjuntar imágenes en los eventos?**  
R: La funcionalidad está preparada pero aún no implementada. Próximamente estará disponible.

**P: ¿Cómo sé si el mensaje se envió correctamente?**  
R: El sistema mostrará una confirmación y el evento aparecerá en la lista de "Eventos Enviados".

### Usuarios (Solo Admin)

**P: ¿Puedo cambiar mi propio rol?**  
R: No, por seguridad, solo otro administrador puede cambiar tu rol.

**P: ¿Qué pasa con los datos de un usuario desactivado?**  
R: Los datos se conservan. El usuario solo no podrá iniciar sesión hasta ser reactivado.

**P: ¿Puedo recuperar un usuario eliminado?**  
R: No, la eliminación es permanente. Deberás crear un nuevo usuario con los mismos datos.

### Técnico

**P: El dashboard no carga, ¿qué hago?**  
R: 
1. Verifica tu conexión a internet
2. Actualiza la página (F5 o Ctrl+R)
3. Limpia la caché del navegador
4. Prueba en modo incógnito
5. Si persiste, contacta al administrador

**P: ¿Qué navegadores son compatibles?**  
R: Chrome, Firefox, Edge y Safari (versiones recientes). Recomendamos Chrome para mejor experiencia.

**P: ¿Funciona en móvil?**  
R: Sí, pero la experiencia está optimizada para desktop. Para móvil, usa modo horizontal.

**P: ¿Los datos están seguros?**  
R: Sí, todas las conexiones están cifradas con HTTPS y la información se almacena de forma segura en MongoDB Atlas.

---

## 📞 Soporte Técnico

### ¿Necesitas ayuda?

**Contacta a:**
- **Email**: info@avellano.com
- **Teléfono**: 310-232-5151
- **WhatsApp**: 310-232-5151
- **Administrador del Sistema**: Tu administrador interno

### Horarios de Atención

- **Lunes a Viernes**: 8:00 AM - 6:00 PM
- **Sábados**: 8:00 AM - 2:00 PM
- **Domingos y Festivos**: Cerrado

### Reportar un Error

Si encuentras un error:
1. Toma una captura de pantalla
2. Anota qué estabas haciendo cuando ocurrió
3. Copia el mensaje de error (si hay)
4. Envía la información a soporte con:
   - Tu nombre de usuario
   - Tu rol
   - Navegador que usas
   - Fecha y hora del error

### Solicitar Nuevas Funcionalidades

Si tienes ideas para mejorar el sistema:
1. Documenta tu sugerencia detalladamente
2. Explica cómo beneficiaría al equipo
3. Proporciona ejemplos de uso
4. Envía tu propuesta al administrador

---

## 📚 Recursos Adicionales

### Manuales Relacionados

- [`MANUAL_INSTALACION.md`](MANUAL_INSTALACION.md): Instalación técnica del sistema
- [`ROLES_SISTEMA.md`](ROLES_SISTEMA.md): Detalles técnicos de roles y permisos
- [`EVENTOS_DOCUMENTACION.md`](EVENTOS_DOCUMENTACION.md): Documentación completa de eventos
- [`SENDGRID_SETUP.md`](SENDGRID_SETUP.md): Configuración de emails
- [`MONGODB_SETUP.md`](MONGODB_SETUP.md): Configuración de base de datos
- [`DESPLIEGUE_VERCEL.md`](DESPLIEGUE_VERCEL.md): Guía de despliegue

### Flujos del Chatbot

El chatbot está organizado en los siguientes flujos:

- **Welcome Flow**: Saludo inicial y captura de datos
- **Catálogo Flow**: Navegación por productos
- **Pedido Flow**: Creación y gestión de pedidos
- **Ubicación Flow**: Captura de dirección de entrega
- **Recetas Flow**: Información de recetas con productos
- **Atención Flow**: Soporte al cliente
- **Hogar/Negocios Flow**: Segmentación de clientes

### Videos Tutoriales

*(En desarrollo - próximamente disponibles)*

---

## 🔄 Actualizaciones del Sistema

### Versión Actual: 1.0

**Funcionalidades incluidas:**
- ✅ Dashboard administrativo completo
- ✅ Gestión de clientes
- ✅ Gestión de pedidos
- ✅ Sistema de conversaciones
- ✅ Envío de eventos masivos
- ✅ Gestión de usuarios y roles
- ✅ Autenticación y recuperación de contraseña

### Próximas Actualizaciones

**En desarrollo:**
- 🔜 Programación de eventos
- 🔜 Exportación de datos a Excel/CSV
- 🔜 Estadísticas avanzadas y gráficos
- 🔜 Envío de imágenes en eventos
- 🔜 Integración con Power BI
- 🔜 Notificaciones push
- 🔜 Chat en vivo con clientes

---

## 💡 Mejores Prácticas

### Para Todos los Usuarios

1. **Seguridad**
   - No compartas tu contraseña
   - Cierra sesión al terminar
   - Usa contraseñas seguras (mínimo 8 caracteres, letras y números)
   - No dejes tu sesión abierta en computadores públicos

2. **Eficiencia**
   - Usa las funciones de búsqueda para encontrar información rápidamente
   - Aprovecha los filtros disponibles
   - Revisa regularmente los pedidos asignados

3. **Comunicación**
   - Sé claro y profesional en los mensajes a clientes
   - Revisa la ortografía antes de enviar eventos
   - Personaliza los mensajes cuando sea posible

### Para Administradores

1. **Gestión de Usuarios**
   - Crea usuarios con el rol apropiado desde el inicio
   - Revisa periódicamente usuarios inactivos
   - Mantén actualizada la información de contacto

2. **Eventos**
   - Planifica los eventos con anticipación
   - Segmenta correctamente los destinatarios
   - No satures a los clientes con mensajes
   - Mide los resultados de cada campaña

3. **Monitoreo**
   - Revisa regularmente las estadísticas
   - Identifica patrones en pedidos y conversaciones
   - Capacita a nuevos usuarios

### Para Operadores

1. **Seguimiento de Pedidos**
   - Revisa diariamente los pedidos pendientes
   - Actualiza el estado de los pedidos oportunamente
   - Contacta a clientes ante cualquier novedad

2. **Atención al Cliente**
   - Responde rápido a las consultas
   - Sé profesional y cortés
   - Escala problemas complejos a soporte o administración

---

## ✅ Checklist de Inicio

### Para Nuevos Usuarios

- [ ] He recibido mis credenciales de acceso
- [ ] He iniciado sesión exitosamente
- [ ] He cambiado mi contraseña temporal
- [ ] He explorado el dashboard
- [ ] Entiendo mi rol y permisos
- [ ] Sé cómo buscar clientes
- [ ] Sé cómo ver pedidos
- [ ] He leído las secciones relevantes del manual
- [ ] He contactado a soporte si tengo dudas

### Para Administradores

- [ ] He configurado todos los usuarios necesarios
- [ ] He verificado que los roles estén correctamente asignados
- [ ] He probado el envío de eventos
- [ ] He revisado la configuración del sistema
- [ ] He capacitado a los nuevos usuarios
- [ ] Tengo los contactos de soporte técnico

### Para Operadores

- [ ] Conozco mi zona/tipo de cliente asignado
- [ ] Sé cómo filtrar mis pedidos
- [ ] Entiendo los estados de pedidos
- [ ] Sé cómo contactar a los clientes
- [ ] He revisado los pedidos pendientes

---

## 🎉 ¡Bienvenido al Sistema!

Ya estás listo para usar el Sistema Chatbot Avellano de manera efectiva.

### Recuerda

- ✨ Mantén tus credenciales seguras
- 🔒 Cierra sesión al terminar
- 🐛 Reporta cualquier anomalía
- 🚀 Aprovecha todas las funcionalidades según tu rol
- 📚 Consulta este manual cuando tengas dudas
- 💬 Contacta a soporte si necesitas ayuda

---

## 📄 Información del Manual

**Versión:** 1.0  
**Última Actualización:** Diciembre 2025  
**Autor:** Equipo Avellano  
**Contacto:** info@avellano.com  

---

## 📝 Notas Finales

Este manual está en constante actualización. Si encuentras información desactualizada o tienes sugerencias para mejorarlo, por favor contacta al administrador del sistema.

**¿Tienes más preguntas?** Consulta los manuales técnicos en la carpeta del proyecto o contacta a soporte.

---

**© 2025 Avellano - Todos los derechos reservados**
