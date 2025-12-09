# 🚀 Guía de Despliegue en Vercel - Dashboard Avellano

## ⚠️ IMPORTANTE: Arquitectura del Proyecto

Este proyecto tiene **2 aplicaciones**:

1. **Dashboard/API** (`src/server.ts`) - ✅ **SE DESPLIEGA EN VERCEL**
2. **Bot de WhatsApp** (`src/app.ts`) - ❌ **NO se despliega en Vercel** (requiere Railway/Render)

Esta guía cubre solo el **Dashboard**.

---

## 📋 Requisitos Previos

- [ ] Cuenta en Vercel (https://vercel.com)
- [ ] Cuenta en MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
- [ ] Cuenta en SendGrid (https://sendgrid.com)
- [ ] GitHub Desktop o Git instalado
- [ ] Node.js instalado

---

## 🔧 Paso 1: Preparar Variables de Entorno

Vercel no lee archivos `.env`, debes configurarlas en el dashboard.

**Variables necesarias:**

```
MONGO_URI=mongodb+srv://nicolix28:Nicolascabezas16@chatbot.0c5yk7g.mongodb.net/chatbot?retryWrites=true&w=majority&appName=chatbot
JWT_SECRET=tu_secret_super_seguro_cambiar_en_produccion
JWT_REFRESH_SECRET=tu_refresh_secret_super_seguro_diferente_cambiar_en_produccion
SENDGRID_API_KEY=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
SENDGRID_FROM_EMAIL=zenservesas@gmail.com
SENDGRID_FROM_NAME=Avellano
PORT=3009
```

---

## 📦 Paso 2: Subir Código a GitHub

### Opción A: Usando GitHub Desktop

1. Abre GitHub Desktop
2. Clic en "Current Repository" → "Add" → "Add Existing Repository"
3. Selecciona la carpeta: `C:\Users\barre\OneDrive\Documentos\Semestre_VI\Chatbot\Chatbot_whatsapp`
4. Clic en "Create Repository"
5. Escribe un commit message: "Deploy dashboard to Vercel"
6. Clic en "Commit to main"
7. Clic en "Publish repository"
8. Marca "Keep this code private" si quieres
9. Clic en "Publish Repository"

### Opción B: Usando Terminal

```powershell
cd C:\Users\barre\OneDrive\Documentos\Semestre_VI\Chatbot\Chatbot_whatsapp

# Inicializar git (si no está ya)
git init

# Agregar todos los archivos
git add .

# Crear commit
git commit -m "Deploy dashboard to Vercel"

# Crear repositorio en GitHub y conectar
# Ve a https://github.com/new
# Crea un repo llamado "Chatbot_whatsapp"
# Luego ejecuta:

git remote add origin https://github.com/TU_USUARIO/Chatbot_whatsapp.git
git branch -M main
git push -u origin main
```

---

## 🌐 Paso 3: Desplegar en Vercel

### 3.1 Crear Cuenta y Conectar GitHub

1. **Ve a:** https://vercel.com
2. **Clic en:** "Sign Up" 
3. **Selecciona:** "Continue with GitHub"
4. **Autoriza** a Vercel acceder a tus repositorios

### 3.2 Importar Proyecto

1. **Clic en:** "Add New..." → "Project"
2. **Busca:** "Chatbot_whatsapp" en la lista
3. **Clic en:** "Import"

### 3.3 Configurar Proyecto

En la pantalla de configuración:

**Framework Preset:**
- Selecciona: "Other"

**Build and Output Settings:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**Root Directory:**
- Deja en blanco (usa la raíz)

### 3.4 Configurar Variables de Entorno

**MUY IMPORTANTE:** Antes de hacer deploy, configura las variables:

1. Clic en **"Environment Variables"**
2. Agrega **UNA POR UNA** las siguientes:

| Name | Value |
|------|-------|
| `MONGO_URI` | `mongodb+srv://nicolix28:Nicolascabezas16@chatbot.0c5yk7g.mongodb.net/chatbot?retryWrites=true&w=majority&appName=chatbot` |
| `JWT_SECRET` | `avellano_dashboard_secret_2025_production` |
| `JWT_REFRESH_SECRET` | `avellano_refresh_secret_2025_production` |
| `SENDGRID_API_KEY` | `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` |
| `SENDGRID_FROM_EMAIL` | `zenservesas@gmail.com` |
| `SENDGRID_FROM_NAME` | `Avellano` |

**Para cada variable:**
- Pega el **Name** en el primer campo
- Pega el **Value** en el segundo campo
- Marca las 3 opciones: **Production**, **Preview**, **Development**
- Clic en **"Add"**

### 3.5 Deploy

1. Clic en **"Deploy"**
2. Espera 2-5 minutos mientras Vercel construye tu proyecto
3. ✅ Verás "Congratulations!" cuando termine

---

## 🔗 Paso 4: Obtener URL del Dashboard

Después del deploy:

1. Vercel te mostrará una URL como: `https://chatbot-whatsapp-xxx.vercel.app`
2. **Copia esta URL**
3. **Prueba accediendo a:**
   - `https://tu-url.vercel.app/login.html`
   - Inicia sesión con tu usuario admin

---

## 🔧 Paso 5: Configurar Dominio Personalizado (Opcional)

Si tienes un dominio propio:

1. Ve al **Dashboard de Vercel** → Tu proyecto
2. Clic en **"Settings"** → **"Domains"**
3. Clic en **"Add"**
4. Ingresa tu dominio: `dashboard.avellano.com`
5. Sigue las instrucciones para configurar DNS

---

## 🐛 Paso 6: Verificar que Funcione

### Checklist de Pruebas:

- [ ] Accede a `https://tu-url.vercel.app/login.html`
- [ ] Inicia sesión con tu usuario
- [ ] Ve a la pestaña **Clientes**
- [ ] Ve a la pestaña **Pedidos**
- [ ] Prueba recuperar contraseña
- [ ] Revisa que llegue el email de SendGrid

### Si algo falla:

1. Ve al **Dashboard de Vercel** → Tu proyecto
2. Clic en **"Deployments"**
3. Clic en el deployment más reciente
4. Clic en **"View Function Logs"**
5. Busca errores en los logs

---

## 🔄 Paso 7: Actualizar el Dashboard

Cada vez que hagas cambios:

### Con GitHub Desktop:

1. Abre GitHub Desktop
2. Verás los archivos modificados
3. Escribe un mensaje: "Actualizar dashboard"
4. Clic en "Commit to main"
5. Clic en "Push origin"
6. **Vercel detectará el cambio y desplegará automáticamente**

### Con Terminal:

```powershell
git add .
git commit -m "Actualizar dashboard"
git push
```

**Vercel re-desplegará automáticamente** en 2-3 minutos.

---

## ⚙️ Configuración Avanzada

### Cambiar Puerto (si es necesario)

Vercel asigna puertos automáticamente, pero puedes forzar uno:

1. En Vercel Dashboard → Settings → Environment Variables
2. Agrega: `PORT` = `3009`
3. Redeploy

### Habilitar Logs en Tiempo Real

1. Instala Vercel CLI:
```powershell
npm install -g vercel
```

2. Login:
```powershell
vercel login
```

3. Ver logs en tiempo real:
```powershell
vercel logs https://tu-url.vercel.app
```

---

## 🚨 Problemas Comunes

### Error: "Module not found"

**Solución:**
```powershell
# En tu proyecto local
npm install
npm run build
git add .
git commit -m "Fix dependencies"
git push
```

### Error: "Cannot connect to MongoDB"

**Solución:**
1. Ve a MongoDB Atlas
2. Network Access → Add IP Address
3. Selecciona **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Guarda

### Error: "SendGrid 401 Unauthorized"

**Solución:**
1. Verifica que la API Key sea correcta
2. Ve a SendGrid Dashboard
3. Settings → API Keys
4. Crea una nueva si es necesario
5. Actualiza en Vercel Environment Variables

---

## 📊 Monitoreo

Vercel te da analytics gratis:

1. Dashboard → Tu proyecto → **"Analytics"**
2. Verás:
   - Requests por minuto
   - Tiempo de respuesta
   - Errores
   - Uso de bandwidth

---

## 💰 Costos

**Plan Free de Vercel incluye:**
- ✅ 100GB bandwidth/mes
- ✅ Despliegues ilimitados
- ✅ SSL automático
- ✅ 100 dominios

**Suficiente para empezar**, escala cuando crezcas.

---

## 📞 Soporte

**¿Tienes problemas?**

1. **Logs de Vercel:** https://vercel.com/docs/observability/runtime-logs
2. **Discord de Vercel:** https://vercel.com/discord
3. **Documentación:** https://vercel.com/docs

---

## ✅ Checklist Final

Antes de dar por terminado:

- [ ] Dashboard accesible en URL de Vercel
- [ ] Login funciona correctamente
- [ ] Datos de MongoDB se muestran
- [ ] Recuperación de contraseña funciona
- [ ] Emails de SendGrid llegan
- [ ] Variables de entorno configuradas
- [ ] Dominio personalizado (opcional)
- [ ] Logs sin errores críticos

---

## 🎉 ¡Felicidades!

Tu dashboard está desplegado en producción.

**URL del dashboard:** https://tu-proyecto.vercel.app

**Siguiente paso:** Desplegar el bot de WhatsApp en Railway (ver `DESPLIEGUE_RAILWAY.md`)
