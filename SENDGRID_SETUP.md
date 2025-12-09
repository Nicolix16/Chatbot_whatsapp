# 📧 Configuración de SendGrid para Recuperación de Contraseña

## 🚀 Pasos para Configurar SendGrid

### 1. Crear Cuenta en SendGrid

1. Ve a [SendGrid](https://signup.sendgrid.com/)
2. Regístrate (plan gratuito incluye 100 emails/día)
3. Verifica tu email

### 2. Obtener API Key

1. Inicia sesión en SendGrid
2. Ve a **Settings** → **API Keys**
3. Haz clic en **"Create API Key"**
4. Nombre: `Avellano-Recovery` (o el que prefieras)
5. Permisos: **"Full Access"** o **"Mail Send"** (mínimo requerido)
6. Copia la API Key generada (⚠️ solo se muestra una vez)

### 3. Verificar Email de Remitente

**Opción A: Verificación de Email Individual (Desarrollo)**
1. Ve a **Settings** → **Sender Authentication**
2. Selecciona **"Single Sender Verification"**
3. Completa el formulario con tu email
4. Verifica tu email con el enlace recibido

**Opción B: Verificación de Dominio (Producción)**
1. Ve a **Settings** → **Sender Authentication**
2. Selecciona **"Domain Authentication"**
3. Sigue las instrucciones para agregar registros DNS

### 4. Configurar Variables de Entorno

Edita tu archivo `.env` y agrega:

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=tu-email-verificado@gmail.com
SENDGRID_FROM_NAME=Avellano
APP_URL=http://localhost:3009
```

**Valores:**
- `SENDGRID_API_KEY`: La API Key que copiaste en el paso 2
- `SENDGRID_FROM_EMAIL`: El email que verificaste en el paso 3
- `SENDGRID_FROM_NAME`: Nombre que aparecerá como remitente
- `APP_URL`: URL base de tu aplicación

### 5. Reiniciar el Servidor

```bash
npm run dev:dashboard
```

Deberías ver en la consola:
```
📧 SendGrid configurado correctamente
```

## 🧪 Probar Recuperación de Contraseña

### Modo Desarrollo (sin SendGrid configurado)

Si no configuras `SENDGRID_API_KEY`, el sistema funcionará en modo desarrollo:
- El enlace de recuperación se mostrará en la consola del servidor
- También se incluye en la respuesta JSON
- Útil para desarrollo y pruebas locales

### Modo Producción (con SendGrid)

1. Ve a `/login.html`
2. Haz clic en "¿Olvidó su contraseña?"
3. Ingresa tu email
4. Revisa tu bandeja de entrada
5. Haz clic en el botón del email
6. Crea tu nueva contraseña

## 📋 Plantilla de Email

El email incluye:
- ✅ Diseño responsive (funciona en móvil y desktop)
- ✅ Header con gradiente de Avellano
- ✅ Botón grande y visible
- ✅ Enlace alternativo en texto plano
- ✅ Advertencia de expiración (1 hora)
- ✅ Versión HTML y texto plano

## 🔒 Seguridad Implementada

- **Token JWT:** Válido por 1 hora
- **Un solo uso:** El token se elimina al usarlo
- **Respuestas genéricas:** No revela si el email existe
- **Hash seguro:** Contraseñas con bcrypt (salt 10)
- **Invalidación de sesiones:** Cierra todas las sesiones activas

## 🌍 Configuración para Producción

### Variables de Entorno Producción

```env
SENDGRID_API_KEY=SG.tu-api-key-de-produccion
SENDGRID_FROM_EMAIL=noreply@tudominio.com
SENDGRID_FROM_NAME=Avellano
APP_URL=https://tudominio.com
JWT_SECRET=secreto-ultra-seguro-cambiar-aqui
JWT_REFRESH_SECRET=otro-secreto-diferente-ultra-seguro
```

### Recomendaciones

1. **Dominio verificado:** Usa verificación de dominio completo
2. **SSL/TLS:** Asegúrate de usar HTTPS
3. **Monitoreo:** Revisa los logs de SendGrid regularmente
4. **Límites:** Plan gratuito: 100 emails/día, plan pagado según necesidad

## 📊 Monitoreo de Emails

1. Ve a **Activity** en SendGrid
2. Revisa los emails enviados, entregados, rebotados
3. Analiza tasas de apertura y clics

## ❌ Solución de Problemas

### Error: "Unauthorized"
- Verifica que la API Key sea correcta
- Asegúrate de que tenga permisos de "Mail Send"

### Error: "The from email does not contain a valid address"
- El email de remitente no está verificado
- Completa la verificación en SendGrid

### No llega el email
1. Revisa spam/correo no deseado
2. Verifica que el email de destino sea correcto
3. Revisa Activity en SendGrid
4. Verifica que no hayas alcanzado el límite de envíos

### Modo desarrollo funciona pero producción no
- Verifica que `SENDGRID_API_KEY` esté en el .env de producción
- Confirma que las variables de entorno se carguen correctamente
- Revisa los logs del servidor

## 📞 Soporte

- [Documentación SendGrid](https://docs.sendgrid.com/)
- [Status SendGrid](https://status.sendgrid.com/)
- [Soporte SendGrid](https://support.sendgrid.com/)
