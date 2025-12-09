# 🔒 Política de Seguridad de Logs

## ❌ NUNCA Logear en Consola

### Información Sensible Prohibida

**Datos Personales:**
- ❌ Teléfonos completos
- ❌ Emails completos
- ❌ Nombres completos
- ❌ Direcciones completas
- ❌ IDs de documentos MongoDB

**Datos de Autenticación:**
- ❌ Contraseñas (ni siquiera hasheadas)
- ❌ Tokens JWT
- ❌ Tokens de recuperación
- ❌ API Keys
- ❌ URLs con tokens

**Datos de Negocio:**
- ❌ Detalles completos de pedidos
- ❌ Información financiera
- ❌ Datos de clientes específicos

---

## ✅ Logs Permitidos

### Información Operativa Segura

**Cantidades y Estadísticas:**
```typescript
✅ console.log('📦 Pedidos encontrados:', pedidos.length)
✅ console.log('👥 Clientes asignados:', clientesAsignados.length)
✅ console.log('✅ Usuario creado exitosamente')
```

**Estados y Operaciones:**
```typescript
✅ console.log('✅ Pedido actualizado - Estado:', estado)
✅ console.log('🔐 Token de recuperación generado exitosamente')
✅ console.log('📧 Email enviado exitosamente')
```

**Errores Genéricos:**
```typescript
✅ console.error('❌ Error en autenticación')
✅ console.error('❌ Error actualizando pedido')
✅ console.error('❌ Error de conexión a BD')
```

---

## 🛡️ Buenas Prácticas

### 1. Ofuscar Datos en Desarrollo

```typescript
// ❌ MAL
console.log('Usuario:', user.email)
console.log('Teléfono:', cliente.telefono)

// ✅ BIEN
console.log('Usuario registrado exitosamente')
console.log('Cliente actualizado')
```

### 2. Usar Identificadores Genéricos

```typescript
// ❌ MAL
console.log(`Pedido ${pedido._id} del cliente ${cliente.telefono}`)

// ✅ BIEN
console.log(`Pedido ${pedido.idPedido} procesado`)
```

### 3. Logs de Depuración Condicionales

```typescript
// Solo en ambiente de desarrollo
if (process.env.NODE_ENV === 'development') {
  console.log('[DEV] Información detallada para debugging')
}
```

### 4. Enmascarar Información Parcial

```typescript
// Si REALMENTE necesitas logear algo
function maskPhone(phone: string): string {
  return phone.replace(/(\d{2})(\d+)(\d{4})/, '$1****$3')
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  return `${user.substring(0, 2)}***@${domain}`
}

// Uso
console.log('📧 Email:', maskEmail(user.email)) // jo***@example.com
console.log('📞 Tel:', maskPhone(cliente.telefono)) // 57****0327
```

---

## 📋 Checklist de Revisión

Antes de hacer commit, verifica:

- [ ] No hay `console.log` con teléfonos completos
- [ ] No hay `console.log` con emails completos
- [ ] No hay `console.log` con tokens o passwords
- [ ] No hay `console.log` con IDs de MongoDB
- [ ] No hay `console.log` con direcciones completas
- [ ] Los logs de error no revelan información sensible
- [ ] Los logs de éxito son genéricos

---

## 🔍 Comandos de Verificación

### Buscar Logs Sospechosos

```powershell
# Buscar logs con teléfonos
git grep "console.log.*telefono" src/

# Buscar logs con emails
git grep "console.log.*email" src/

# Buscar logs con tokens
git grep "console.log.*token" src/

# Buscar logs con IDs
git grep "console.log.*_id" src/
```

### Buscar en Archivos Modificados

```powershell
git diff | Select-String "console.log"
```

---

## 🚨 Respuesta a Incidentes

### Si Se Expuso Información Sensible

1. **Inmediato:**
   - Eliminar el log del código
   - Rotar credenciales expuestas
   - Notificar al equipo

2. **Corto Plazo:**
   - Revisar logs del servidor
   - Verificar accesos sospechosos
   - Documentar el incidente

3. **Largo Plazo:**
   - Actualizar políticas de seguridad
   - Capacitar al equipo
   - Implementar revisiones de código

---

## 📚 Recursos

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [GDPR Data Protection](https://gdpr.eu/data-protection/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**Última Actualización:** Diciembre 2025  
**Responsable:** Equipo de Desarrollo Avellano
