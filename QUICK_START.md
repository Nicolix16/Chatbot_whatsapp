# 🚀 Quick Start - Despliegue Rápido

## Paso 1: Preparar el código

```bash
# Asegúrate de estar en la rama main
git checkout main

# Ver cambios pendientes
git status

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "feat: configuración para deployment en Vercel y Railway"

# Subir a GitHub
git push origin main
```

---

## Paso 2: Desplegar Backend (Railway - Recomendado)

### Opción A: Railway (Más Fácil)

1. **Ir a:** https://railway.app
2. **Login** con GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Seleccionar: `Chatbot_whatsapp`
5. **Settings:**
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build:server`
   - Start Command: `npm run start:dashboard`
6. **Variables** → Agregar:
   ```env
   PORT=3009
   MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/chatbot_avellano
   JWT_SECRET=cambiar_esto_por_algo_muy_seguro
   SENDGRID_API_KEY=SG.tu_api_key_aqui
   EMAIL_FROM=noreply@tudominio.com
   NODE_ENV=production
   ALLOWED_ORIGINS=http://localhost:3000
   ```
7. **Deploy** → Esperar
8. **Copiar URL** del backend (ej: `https://chatbot-avellano.up.railway.app`)

### Opción B: Render

1. **Ir a:** https://render.com
2. **Login** con GitHub
3. **New +** → **Web Service**
4. Seleccionar: `Chatbot_whatsapp`
5. **Configurar:**
   - Name: `chatbot-avellano-backend`
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build:server`
   - Start Command: `npm run start:dashboard`
   - Instance Type: Free
6. **Environment Variables** → Agregar las mismas de arriba
7. **Create Web Service**
8. **Copiar URL** (ej: `https://chatbot-avellano.onrender.com`)

---

## Paso 3: Actualizar URL del Backend en el Frontend

```bash
# Editar el archivo de configuración
# Abrir: frontend/public/js/config.js

# Cambiar esta línea:
API_URL: window.location.hostname === 'localhost' 
  ? 'http://localhost:3009/api'
  : 'TU_BACKEND_URL_AQUI/api', // ⚠️ CAMBIA ESTO

# Por (ejemplo con Railway):
API_URL: window.location.hostname === 'localhost' 
  ? 'http://localhost:3009/api'
  : 'https://chatbot-avellano.up.railway.app/api',
```

**Guardar cambios y hacer commit:**

```bash
git add frontend/public/js/config.js
git commit -m "fix: actualizar URL del backend para producción"
git push origin main
```

---

## Paso 4: Desplegar Frontend en Vercel

1. **Ir a:** https://vercel.com
2. **Login** con GitHub
3. **Add New Project**
4. **Import** tu repositorio: `Chatbot_whatsapp`
5. Vercel detecta automáticamente `vercel.json` ✅
6. **Deploy** → Esperar build
7. **Copiar URL** de Vercel (ej: `https://chatbot-avellano.vercel.app`)

---

## Paso 5: Actualizar CORS en el Backend

Agregar la URL de Vercel a las variables de entorno del backend:

**En Railway/Render:**

```env
ALLOWED_ORIGINS=https://chatbot-avellano.vercel.app,https://chatbot-avellano-git-main.vercel.app,http://localhost:3000
```

**Guardar y reiniciar** el servicio.

---

## Paso 6: Verificar que Todo Funcione

### ✅ Checklist Final

1. **Backend Health Check:**
   ```
   https://tu-backend.railway.app/api/health
   ```
   Debe responder: `{"status":"ok"}`

2. **Frontend Carga:**
   ```
   https://tu-proyecto.vercel.app
   ```
   Debe mostrar la página de login

3. **Login Funciona:**
   - Ingresar credenciales
   - Verificar que carga el dashboard
   - Revisar consola (F12) - no debe haber errores CORS

4. **Datos se Cargan:**
   - Clientes, Pedidos, Conversaciones deben aparecer
   - Si está vacío, es porque no hay datos en MongoDB (normal)

---

## 🎉 ¡Listo!

Tu aplicación está desplegada:

- **Frontend:** `https://tu-proyecto.vercel.app`
- **Backend:** `https://tu-backend.railway.app`
- **MongoDB:** En la nube con Atlas

---

## 🔄 Actualizaciones Futuras

Cada vez que hagas cambios:

```bash
git add .
git commit -m "descripción del cambio"
git push origin main
```

**Vercel y Railway se actualizan automáticamente** 🚀

---

## 🆘 Problemas Comunes

### Error: "CORS policy blocked"

**Solución:**
```env
# En Railway/Render, actualizar ALLOWED_ORIGINS:
ALLOWED_ORIGINS=https://tu-proyecto.vercel.app,http://localhost:3000
```

### Error: "Cannot connect to MongoDB"

**Solución:**
1. Ir a MongoDB Atlas → Network Access
2. Agregar IP: `0.0.0.0/0`
3. Verificar que `MONGODB_URI` sea correcta

### Error: "Build failed" en Railway/Render

**Solución:**
1. Verificar que Root Directory sea `backend`
2. Verificar Build Command: `npm install && npm run build:server`
3. Revisar los logs para más detalles

---

## 📚 Documentación Completa

- `DEPLOYMENT.md` - Guía detallada paso a paso
- `ENV_CONFIG.md` - Variables de entorno explicadas
- `deployment-checklist.html` - Checklist interactivo (abre en navegador)

---

## 🔑 Credenciales de Prueba

Ejecuta este script para crear un usuario admin:

```bash
cd backend
npm run seed:user
```

Credenciales creadas:
- **Email:** admin@avellano.com
- **Password:** Admin123!

---

**¡Éxito con tu deployment! 🚀**
