# 🚀 Guía de Despliegue - Chatbot Avellano

## Arquitectura de Despliegue

```
Frontend (Vercel)          Backend (Railway/Render)
┌─────────────────┐       ┌──────────────────────┐
│  Dashboard Web  │◄─────►│  API REST + Bot WA   │
│  (HTML/CSS/JS)  │       │  (Node.js/Express)   │
└─────────────────┘       └──────────────────────┘
                                    │
                                    ▼
                          ┌──────────────────┐
                          │   MongoDB Atlas  │
                          └──────────────────┘
```

---

## 📱 Frontend en Vercel

### Paso 1: Preparar el Repositorio

1. **Asegúrate de tener Git configurado:**
   ```bash
   git add .
   git commit -m "feat: configuración para Vercel"
   git push origin main
   ```

### Paso 2: Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Click en **"Add New Project"**
3. Importa tu repositorio desde GitHub
4. Vercel detectará automáticamente la configuración de `vercel.json`

### Paso 3: Configurar Variables de Entorno (si necesitas)

En Vercel, ve a **Settings → Environment Variables** y agrega:

```
(No necesitas variables de entorno para el frontend estático)
```

### Paso 4: Desplegar

1. Click en **"Deploy"**
2. Espera a que termine el build
3. Tu frontend estará disponible en: `https://tu-proyecto.vercel.app`

### Paso 5: Configurar la URL del Backend

1. Una vez desplegado el backend (ver sección siguiente), edita `frontend/public/js/config.js`:
   
   ```javascript
   API_URL: window.location.hostname === 'localhost' 
     ? 'http://localhost:3009/api'
     : 'https://TU-BACKEND-URL.railway.app/api', // ⚠️ CAMBIA ESTO
   ```

2. Haz commit y push:
   ```bash
   git add frontend/public/js/config.js
   git commit -m "fix: actualizar URL del backend"
   git push
   ```

3. Vercel re-desplegará automáticamente

---

## 🖥️ Backend en Railway (Recomendado)

### Paso 1: Crear Cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con GitHub

### Paso 2: Crear Nuevo Proyecto

1. Click en **"New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Selecciona tu repositorio
4. Configura:
   - **Root Directory:** `backend`
   - **Build Command:** `npm run build:server`
   - **Start Command:** `npm start:dashboard`

### Paso 3: Variables de Entorno

En Railway, ve a **Variables** y agrega:

```env
PORT=3009
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/chatbot
JWT_SECRET=un_secreto_muy_seguro_cambialo_123
SENDGRID_API_KEY=SG.tu_api_key_aqui
EMAIL_FROM=noreply@tudominio.com
NODE_ENV=production
```

### Paso 4: Configurar MongoDB Atlas

1. Ve a [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Crea un cluster gratuito
3. En **Network Access**, permite acceso desde cualquier IP: `0.0.0.0/0`
4. Copia la cadena de conexión y úsala en `MONGODB_URI`

### Paso 5: Obtener URL del Backend

1. Una vez desplegado, Railway te dará una URL como:
   ```
   https://chatbot-avellano.up.railway.app
   ```

2. **Copia esta URL** y actualízala en el frontend (Paso 5 de Vercel)

### Paso 6: Habilitar CORS

El backend ya tiene CORS configurado, pero verifica que incluya tu dominio de Vercel en `backend/src/server.ts`

---

## 🔄 Alternativa: Backend en Render

### Paso 1: Crear Cuenta

1. Ve a [render.com](https://render.com)
2. Inicia sesión con GitHub

### Paso 2: Crear Web Service

1. Click en **"New +"** → **"Web Service"**
2. Conecta tu repositorio
3. Configura:
   - **Name:** `chatbot-avellano-backend`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build:server`
   - **Start Command:** `npm run start:dashboard`
   - **Instance Type:** Free

### Paso 3: Variables de Entorno

Agrega las mismas variables que en Railway (ver arriba)

### Paso 4: Desplegar

1. Click en **"Create Web Service"**
2. Espera el primer deploy (puede tardar 5-10 min)
3. Copia la URL generada (ej: `https://chatbot-avellano.onrender.com`)

---

## ✅ Verificación del Despliegue

### Frontend
1. Visita tu URL de Vercel
2. Verifica que cargue la página de login
3. Revisa la consola del navegador (F12) para errores

### Backend
1. Visita `https://tu-backend.railway.app/api/health`
2. Deberías ver: `{"status":"ok"}`

### Integración Completa
1. Haz login en el dashboard
2. Verifica que se carguen los datos
3. Comprueba que el bot de WhatsApp esté activo

---

## 🛠️ Troubleshooting

### Error: CORS al conectar frontend con backend

Edita `backend/src/server.ts` y asegúrate de incluir tu dominio de Vercel:

```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://tu-proyecto.vercel.app' // ⚠️ Agrega tu dominio
  ],
  credentials: true
}));
```

### Error: Cannot connect to MongoDB

1. Verifica que la IP `0.0.0.0/0` esté permitida en MongoDB Atlas
2. Comprueba que `MONGODB_URI` esté correcta
3. Asegúrate de que el usuario tenga permisos de lectura/escritura

### Error: Bot de WhatsApp no se conecta

El bot necesita escanear el QR la primera vez:
1. Revisa los logs de Railway/Render
2. Busca el QR code en los logs
3. Escanéalo con WhatsApp Business

---

## 📝 Resumen de URLs

Después del despliegue tendrás:

- **Frontend:** `https://tu-proyecto.vercel.app`
- **Backend:** `https://tu-backend.railway.app`
- **MongoDB:** `mongodb+srv://cluster.mongodb.net/chatbot`

---

## 🔐 Seguridad

- ✅ Cambia `JWT_SECRET` por un valor único y seguro
- ✅ No expongas las variables de entorno en el código
- ✅ Usa HTTPS en producción (Vercel y Railway lo hacen automáticamente)
- ✅ Habilita solo los orígenes necesarios en CORS

---

## 📚 Recursos Adicionales

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [MongoDB Atlas](https://www.mongodb.com/docs/atlas)
