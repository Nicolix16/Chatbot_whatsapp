# Importación de Usuarios

## Descripción

El sistema permite crear usuarios de dos formas:
1. **Individual**: Crear un usuario a la vez mediante un formulario
2. **Importar CSV**: Cargar múltiples usuarios desde un archivo CSV

## Formato del archivo CSV

El archivo CSV debe contener las siguientes columnas en este orden:

```
nombre,email,password,rol
```

### Columnas Requeridas

- **nombre**: Nombre completo del usuario
- **email**: Correo electrónico (debe ser único)
- **password**: Contraseña (mínimo 6 caracteres)
- **rol**: Rol del usuario (ver roles válidos abajo)

### Roles Válidos

- `administrador` - Acceso completo al sistema
- `mayorista` - Operador tipo Mayorista
- `director_comercial` - Operador tipo Director Comercial
- `coordinador_masivos` - Operador tipo Coordinador de Masivos
- `ejecutivo_horecas` - Operador tipo Ejecutivo Horecas
- `soporte` - Acceso de soporte

## Ejemplo de Archivo CSV

Usa el archivo `ejemplo-usuarios.csv` como referencia:

```csv
nombre,email,password,rol
Juan Pérez,juanperez@avellano.com,password123,mayorista
María López,marialopez@avellano.com,password123,soporte
Carlos González,carlosgonzalez@avellano.com,password123,director_comercial
Ana Martínez,anamartinez@avellano.com,password123,coordinador_masivos
Pedro Sánchez,pedrosanchez@avellano.com,password123,ejecutivo_horecas
```

## Cómo Importar

1. Ve a la sección **Usuarios** en el panel de administración
2. Haz clic en el botón **+ Agregar Usuario**
3. Selecciona la pestaña **Importar CSV**
4. Haz clic en **Seleccionar archivo** y elige tu archivo CSV
5. Haz clic en **Importar Usuarios**

## Notas Importantes

- Los emails duplicados serán rechazados automáticamente
- Si un usuario ya existe, se reportará como error pero el proceso continuará
- Al finalizar, se mostrará un resumen con el número de usuarios creados y errores
- Los detalles de los errores se pueden ver en la consola del navegador

## Validaciones

El sistema valida automáticamente:
- Formato correcto del archivo CSV
- Presencia de todas las columnas requeridas
- Unicidad de emails
- Validez de los roles
- Longitud mínima de contraseñas (6 caracteres)

## Soporte Técnico

Si tienes problemas con la importación, contacta al equipo de desarrollo.
