# Dockerfile para Railway - Backend
FROM node:21-alpine3.18 as builder

WORKDIR /app

# Instalar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate
ENV PNPM_HOME=/usr/local/bin

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de build
RUN apk add --no-cache --virtual .gyp \
        python3 \
        make \
        g++ \
    && apk add --no-cache git

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Build
RUN npm run build:server

# Limpiar
RUN apk del .gyp

# Etapa de producción
FROM node:21-alpine3.18 as deploy

WORKDIR /app

# Copiar archivos compilados
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Instalar solo dependencias de producción
RUN npm install --production

# Puerto
ENV PORT=3009
EXPOSE 3009

# Usuario no-root
RUN addgroup -g 1001 -S nodejs && adduser -S -u 1001 nodejs
USER nodejs

# Comando de inicio
CMD ["npm", "run", "start:dashboard"]
