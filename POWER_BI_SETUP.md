# 📊 Conexión de Power BI con Dashboard Avellano

## 🔌 Endpoints Disponibles para Power BI

### **1. Clientes**
```
GET http://localhost:3009/api/powerbi/clientes
```
Retorna todos los clientes con campos optimizados para análisis.

### **2. Pedidos**
```
GET http://localhost:3009/api/powerbi/pedidos
```
Retorna todos los pedidos con información completa.

### **3. Productos (Detallado)**
```
GET http://localhost:3009/api/powerbi/productos
```
Retorna una tabla expandida con cada producto de cada pedido (útil para análisis de productos más vendidos).

### **4. Estadísticas Resumidas**
```
GET http://localhost:3009/api/powerbi/estadisticas
```
Retorna KPIs y métricas agregadas.

---

## 📝 Configuración en Power BI Desktop

### **Paso 1: Obtener Token de Acceso**

Primero necesitas obtener un token de autenticación:

1. Inicia sesión en el dashboard: `http://localhost:3009/login.html`
2. Abre la consola del navegador (F12)
3. Ve a la pestaña "Application" → "Local Storage" → `http://localhost:3009`
4. Copia el valor de `access_token`

**Nota:** El token expira cada 1 hora. Para uso prolongado en Power BI, considera crear un token dedicado con mayor duración.

---

### **Paso 2: Conectar Power BI**

#### **Opción A: Importar Datos con Web**

1. Abre Power BI Desktop
2. Clic en **"Obtener datos"** → **"Web"**
3. En "URL" ingresa: `http://localhost:3009/api/powerbi/clientes`
4. Clic en **"Avanzado"**
5. Agrega el encabezado de autenticación:
   - **Nombre del encabezado:** `Authorization`
   - **Valor:** `Bearer TU_ACCESS_TOKEN_AQUI`
6. Clic en **"Aceptar"**
7. Power BI detectará el JSON y lo convertirá en tabla
8. Clic en **"Expandir"** en la columna `data`
9. Selecciona los campos que necesitas
10. Clic en **"Cargar"**

#### **Opción B: Usar Power Query M**

```powerquery
let
    Token = "TU_ACCESS_TOKEN_AQUI",
    Source = Json.Document(
        Web.Contents(
            "http://localhost:3009/api/powerbi/clientes",
            [
                Headers = [
                    #"Authorization" = "Bearer " & Token,
                    #"Content-Type" = "application/json"
                ]
            ]
        )
    ),
    data = Source[data],
    ConvertidoATabla = Table.FromList(data, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    ExpandirColumnas = Table.ExpandRecordColumn(ConvertidoATabla, "Column1", 
        {"id", "telefono", "nombre", "tipoCliente", "tipoNegocio", "ciudad", "direccion", "correo", "cantidadPedidos", "ultimoPedido", "fechaRegistro", "activo"}
    )
in
    ExpandirColumnas
```

---

### **Paso 3: Crear Consultas para Todas las Tablas**

Repite el proceso para:

1. **Clientes**: `http://localhost:3009/api/powerbi/clientes`
2. **Pedidos**: `http://localhost:3009/api/powerbi/pedidos`
3. **Productos**: `http://localhost:3009/api/powerbi/productos`
4. **Estadísticas**: `http://localhost:3009/api/powerbi/estadisticas`

---

### **Paso 4: Crear Relaciones entre Tablas**

En Power BI, ve a **"Modelo"** y crea las siguientes relaciones:

1. **Clientes ↔ Pedidos**
   - Campo: `telefono` (Clientes) → `telefono` (Pedidos)
   - Cardinalidad: Uno a varios

2. **Pedidos ↔ Productos**
   - Campo: `idPedido` (Pedidos) → `idPedido` (Productos)
   - Cardinalidad: Uno a varios

---

## 🔄 Actualización Automática de Datos

### **Para Power BI Desktop:**
1. En "Inicio" → "Actualizar"
2. O configura actualización programada en "Transformar datos" → "Opciones de origen de datos"

### **Para Power BI Service (Publicado):**
1. Publica el informe en Power BI Service
2. Configura un **Gateway de datos local** si el servidor está en tu máquina
3. Programa actualizaciones automáticas en la configuración del dataset

---

## 🔐 Token de Larga Duración (Recomendado)

Para evitar que expire el token cada hora, puedes crear un endpoint especial:

### **Crear usuario específico para Power BI:**

1. En el dashboard, ve a "Usuarios"
2. Crea un nuevo usuario:
   - Email: `powerbi@avellano.com`
   - Rol: `soporte` (solo lectura)
   - Password: segura

3. Usa ese usuario para generar tokens

### **O modificar duración del token:**

Edita `.env` y cambia:
```env
JWT_TOKEN_EXPIRATION=24h  # En lugar de 1h
```

---

## 📊 Visualizaciones Sugeridas

### **Dashboard de Ventas:**
- Total de pedidos por día/mes
- Ventas por ciudad
- Top 10 productos más vendidos
- Estado de pedidos (En proceso, Confirmado, Entregado)

### **Dashboard de Clientes:**
- Crecimiento de clientes nuevos
- Distribución por tipo (Hogar vs Negocio)
- Mapa de clientes por ciudad
- Tasa de retención

### **Dashboard de Productos:**
- Productos más vendidos
- Ingresos por categoría
- Tendencias de venta

---

## 🛠️ Troubleshooting

### **Error: "No se puede conectar"**
- Verifica que el servidor esté corriendo: `npm run dev:dashboard`
- Confirma la URL: `http://localhost:3009`

### **Error: "401 Unauthorized"**
- El token expiró, genera uno nuevo
- Verifica que el header `Authorization` esté correcto

### **Error: "No se pueden expandir los datos"**
- Verifica que la respuesta tenga `data` en el JSON
- Revisa que el endpoint retorne datos válidos

---

## 📝 Ejemplo de Dashboard Completo

```powerquery
// Consulta principal con todas las tablas relacionadas
let
    Token = "TU_ACCESS_TOKEN",
    
    // Clientes
    Clientes = Json.Document(Web.Contents("http://localhost:3009/api/powerbi/clientes", 
        [Headers=[Authorization="Bearer " & Token]]))[data],
    
    // Pedidos
    Pedidos = Json.Document(Web.Contents("http://localhost:3009/api/powerbi/pedidos", 
        [Headers=[Authorization="Bearer " & Token]]))[data],
    
    // Productos
    Productos = Json.Document(Web.Contents("http://localhost:3009/api/powerbi/productos", 
        [Headers=[Authorization="Bearer " & Token]]))[data]
in
    [Clientes=Clientes, Pedidos=Pedidos, Productos=Productos]
```

---

## 🚀 Próximos Pasos

1. Compila el servidor: `npm run build`
2. Inicia el servidor: `npm run dev:dashboard`
3. Obtén tu token de acceso
4. Conecta Power BI con los endpoints
5. Crea tus visualizaciones

**¿Necesitas ayuda?** Revisa los logs del servidor para ver las peticiones de Power BI.
