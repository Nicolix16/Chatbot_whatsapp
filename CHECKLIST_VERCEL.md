# ✅ CHECKLIST COMPLETO - DEPLOY EN VERCEL

## 📋 ANTES DE EMPEZAR

- [ ] MongoDB Atlas configurado (ya lo tienes)
- [ ] SendGrid configurado (ya lo tienes)
- [ ] Cuenta GitHub creada
- [ ] Cuenta Vercel creada

---

## 🔹 PASO 1: SUBIR A GITHUB (5 minutos)

### Opción A: GitHub Desktop (MÁS FÁCIL)
1. [ ] Descargar GitHub Desktop: https://desktop.github.com/
2. [ ] Instalar y hacer login
3. [ ] File → Add Local Repository
4. [ ] Seleccionar carpeta: `C:\Users\barre\OneDrive\Documentos\Semestre_VI\Chatbot\Chatbot_whatsapp`
5. [ ] Escribir mensaje: "Deploy to Vercel"
6. [ ] Clic en "Commit to main"
7. [ ] Clic en "Publish repository"
8. [ ] Marcar "Private" si quieres
9. [ ] Clic en "Publish"

### Opción B: Terminal PowerShell
```powershell
cd C:\Users\barre\OneDrive\Documentos\Semestre_VI\Chatbot\Chatbot_whatsapp
git add .
git commit -m "Deploy to Vercel"
git push
```

---

## 🔹 PASO 2: CREAR CUENTA EN VERCEL (2 minutos)

1. [ ] Ir a: https://vercel.com
2. [ ] Clic en "Sign Up"
3. [ ] Seleccionar "Continue with GitHub"
4. [ ] Autorizar acceso a Vercel
5. [ ] Completar perfil (nombre, etc.)

---

## 🔹 PASO 3: IMPORTAR PROYECTO (3 minutos)

1. [ ] En Vercel, clic en "Add New..." → "Project"
2. [ ] Buscar "Chatbot_whatsapp" en la lista
3. [ ] Clic en "Import"

---

## 🔹 PASO 4: CONFIGURAR BUILD (1 minuto)

En la pantalla de configuración:

**Framework Preset:**
- [ ] Seleccionar: "Other"

**Build Command:**
- [ ] Escribir: `npm run build:server`

**Output Directory:**
- [ ] Escribir: `dist`

**Install Command:**
- [ ] Dejar: `npm install`

---

## 🔹 PASO 5: VARIABLES DE ENTORNO (5 minutos)

⚠️ **MUY IMPORTANTE** - Copiar y pegar EXACTAMENTE:

1. [ ] Clic en "Environment Variables"

2. [ ] Agregar cada variable (una por una):

**Variable 1:**
```
Name: MONGO_URI
Value: mongodb+srv://nicolix28:Nicolascabezas16@chatbot.0c5yk7g.mongodb.net/chatbot?retryWrites=true&w=majority&appName=chatbot
```
✅ Marcar: Production, Preview, Development
Clic en "Add"

**Variable 2:**
```
Name: JWT_SECRET
Value: avellano_dashboard_secret_2025_production
```
✅ Marcar: Production, Preview, Development
Clic en "Add"

**Variable 3:**
```
Name: JWT_REFRESH_SECRET
Value: avellano_refresh_secret_2025_production
```
✅ Marcar: Production, Preview, Development
Clic en "Add"

**Variable 4:**
```
Name: SENDGRID_API_KEY
Value: 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
```
✅ Marcar: Production, Preview, Development
Clic en "Add"

**Variable 5:**
```
Name: SENDGRID_FROM_EMAIL
Value: zenservesas@gmail.com
```
✅ Marcar: Production, Preview, Development
Clic en "Add"

**Variable 6:**
```
Name: SENDGRID_FROM_NAME
Value: Avellano
```
✅ Marcar: Production, Preview, Development
Clic en "Add"

---

## 🔹 PASO 6: DEPLOY (3-5 minutos)

1. [ ] Clic en "Deploy"
2. [ ] Esperar mientras construye (aparecerá un log con texto corriendo)
3. [ ] Cuando termine verás: "Congratulations! 🎉"

---

## 🔹 PASO 7: PROBAR QUE FUNCIONE (2 minutos)

1. [ ] Copiar la URL que aparece (ejemplo: `https://chatbot-whatsapp-xxx.vercel.app`)
2. [ ] Agregar `/login.html` al final
3. [ ] Abrir en navegador: `https://TU-URL.vercel.app/login.html`
4. [ ] Iniciar sesión con tu usuario admin
5. [ ] Verificar que se vean los clientes y pedidos

---

## 🔹 PASO 8: CONFIGURAR MONGODB ATLAS (IMPORTANTE)

Para que Vercel pueda conectarse:

1. [ ] Ir a: https://cloud.mongodb.com/
2. [ ] Login con tu cuenta
3. [ ] Seleccionar tu cluster
4. [ ] Clic en "Network Access" (menú izquierdo)
5. [ ] Clic en "Add IP Address"
6. [ ] Seleccionar "Allow Access from Anywhere"
7. [ ] En IP Address escribir: `0.0.0.0/0`
8. [ ] Clic en "Confirm"

---

## ✅ VERIFICACIÓN FINAL

Prueba todas estas funciones:

- [ ] Login funciona
- [ ] Ver clientes
- [ ] Ver pedidos
- [ ] Ver conversaciones
- [ ] Eventos (solo admin)
- [ ] Usuarios (solo admin)
- [ ] Recuperar contraseña
- [ ] Email de recuperación llega a tu correo

---

## 🚨 SI ALGO SALE MAL

### Ver errores:

1. Ve a Vercel Dashboard
2. Clic en tu proyecto
3. Clic en "Deployments"
4. Clic en el deployment más reciente
5. Clic en "View Function Logs"
6. Lee los errores en rojo

### Errores comunes:

**"Module not found":**
```powershell
# En tu computadora:
npm install
git add .
git commit -m "Fix dependencies"
git push
```

**"Cannot connect to MongoDB":**
- Verifica que agregaste 0.0.0.0/0 en Network Access de MongoDB Atlas

**"401 SendGrid":**
- Verifica que copiaste bien la API Key en Environment Variables

---

## 📱 PARA ACTUALIZAR EL DASHBOARD

Cada vez que hagas cambios:

```powershell
# En PowerShell:
git add .
git commit -m "Descripción del cambio"
git push
```

Vercel re-desplegará automáticamente en 2-3 minutos.

---

## 🎉 ¡LISTO!

Tu dashboard está en producción en:
`https://tu-proyecto.vercel.app/login.html`

**Guarda esta URL** para acceder siempre.

---

## 📞 NECESITAS AYUDA?

- **Documentación Vercel:** https://vercel.com/docs
- **Discord Vercel:** https://vercel.com/discord
- **Status Vercel:** https://vercel-status.com

---

**⏱️ TIEMPO TOTAL ESTIMADO: 20-25 minutos**
