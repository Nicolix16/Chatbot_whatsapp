# Variables de Entorno para Despliegue

## 🔧 Backend (Railway/Render)

Copia estas variables y ajusta los valores según tu configuración:

```env
# Puerto del servidor
PORT=3009

# Base de datos MongoDB Atlas
MONGODB_URI=mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/chatbot_avellano?retryWrites=true&w=majority

# JWT para autenticación
JWT_SECRET=cambia_este_secreto_por_algo_muy_seguro_y_aleatorio_123456789

# SendGrid para emails (recuperación de contraseña)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@tudominio.com

# CORS - Dominios permitidos (separados por coma)
ALLOWED_ORIGINS=https://tu-proyecto.vercel.app,http://localhost:3000

# Entorno
NODE_ENV=production

# WhatsApp (opcional, si despliegas el bot en el mismo servidor)
WHATSAPP_NUMBER=+521234567890
```

---

## 📋 Checklist de Configuración

### 1. MongoDB Atlas

- [ ] Crear cluster en [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- [ ] Crear base de datos llamada `chatbot_avellano`
- [ ] Crear usuario con permisos de lectura/escritura
- [ ] Ir a **Network Access** → Agregar IP: `0.0.0.0/0` (permitir todas las IPs)
- [ ] Copiar connection string y reemplazar:
  - `<username>` por tu usuario
  - `<password>` por tu contraseña
  - `<dbname>` por `chatbot_avellano`

### 2. SendGrid (para recuperación de contraseña)

- [ ] Crear cuenta en [sendgrid.com](https://sendgrid.com)
- [ ] Ir a **Settings** → **API Keys** → **Create API Key**
- [ ] Seleccionar **Full Access** o **Mail Send** permissions
- [ ] Copiar la API Key (solo se muestra una vez)
- [ ] Verificar un dominio o email en **Sender Authentication**

### 3. JWT Secret

Genera un secreto aleatorio seguro:

```bash
# En Linux/Mac:
openssl rand -base64 32

# En Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Online:
# Visita: https://randomkeygen.com/
```

### 4. Railway - Pasos Específicos

1. Ir a tu proyecto en Railway
2. Click en tu servicio → **Variables**
3. Click en **+ New Variable**
4. Pegar todas las variables de arriba
5. Click en **Deploy** para reiniciar

**Configuración adicional:**
- **Root Directory:** `backend`
- **Build Command:** `npm install && npm run build:server`
- **Start Command:** `npm run start:dashboard`

### 5. Render - Pasos Específicos

1. Ir a tu Web Service en Render
2. Click en **Environment** en el sidebar
3. Click en **Add Environment Variable**
4. Agregar cada variable una por una
5. Click en **Save Changes**

**Configuración adicional:**
- **Root Directory:** `backend`
- **Build Command:** `npm install && npm run build:server`
- **Start Command:** `npm run start:dashboard`

### 6. Actualizar ALLOWED_ORIGINS

Una vez que despliegues en Vercel y obtengas la URL:

```env
ALLOWED_ORIGINS=https://tu-proyecto.vercel.app,https://tu-proyecto-git-main.vercel.app,http://localhost:3000
```

**Nota:** Vercel crea múltiples URLs por deployment, agrega las que necesites.

---

## 🧪 Verificar Configuración

### Backend Health Check

Visita: `https://tu-backend.railway.app/api/health`

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2025-12-09T..."
}
```

### Logs del Backend

**Railway:**
```
View → Deployments → Click en el deployment → Ver logs
```

**Render:**
```
Logs tab en tu servicio
```

Busca errores como:
- ❌ `MongooseServerSelectionError` → Problema con MongoDB
- ❌ `CORS error` → Falta agregar dominio a ALLOWED_ORIGINS
- ❌ `JWT malformed` → Falta o es inválido JWT_SECRET

---

## 🚨 Errores Comunes

### Error: "Cannot connect to MongoDB"

**Solución:**
1. Verifica que `MONGODB_URI` sea correcta
2. Asegúrate de reemplazar `<password>` con la contraseña real (sin `<>`)
3. Verifica que la IP `0.0.0.0/0` esté permitida en MongoDB Atlas

### Error: "CORS policy blocked"

**Solución:**
1. Agrega tu dominio de Vercel a `ALLOWED_ORIGINS`
2. Incluye todas las variantes: `tu-proyecto.vercel.app`, `tu-proyecto-git-main.vercel.app`
3. Reinicia el servicio en Railway/Render

### Error: "SendGrid API key invalid"

**Solución:**
1. Verifica que la API key esté completa (empieza con `SG.`)
2. Verifica que tenga permisos de **Mail Send**
3. No es crítico si solo quieres probar (el login funcionará sin esto)

---

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs** del backend (Railway/Render)
2. **Verifica la consola** del navegador (F12) en el frontend
3. **Prueba endpoints** individualmente con Postman/Thunder Client
4. **Comprueba MongoDB Atlas** → Metrics → Connections

---

## 🔄 Actualizaciones Posteriores

Cada vez que hagas cambios en el código:

```bash
git add .
git commit -m "descripción del cambio"
git push origin main
```

- **Vercel** se actualizará automáticamente
- **Railway** se re-desplegará automáticamente
- **Render** se re-desplegará automáticamente (puede tardar más)
