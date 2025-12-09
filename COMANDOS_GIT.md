# 📤 Comandos para Subir a GitHub

# Paso 1: Agregar todos los archivos
git add .

# Paso 2: Crear commit
git commit -m "Preparar proyecto para deploy en Vercel"

# Paso 3: Subir a GitHub (si ya existe el repositorio)
git push origin main

# Si es la primera vez y no has creado el repositorio:
# 1. Ve a https://github.com/new
# 2. Crea un repositorio llamado "Chatbot_whatsapp"
# 3. NO marques "Initialize with README"
# 4. Ejecuta estos comandos:

git remote add origin https://github.com/Nicolix16/Chatbot_whatsapp.git
git branch -M main
git push -u origin main
