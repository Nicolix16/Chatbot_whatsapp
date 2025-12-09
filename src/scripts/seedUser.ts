import * as dotenv from 'dotenv'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import Usuario, { RolUsuario, TipoOperador } from '../models/Usuario'

dotenv.config()

function getArg(name: string, fallback?: string) {
  const prefix = `--${name}=`
  const found = process.argv.find(a => a.startsWith(prefix))
  return found ? found.slice(prefix.length) : fallback
}

async function main() {
  const email = (getArg('email') || process.env.SEED_EMAIL || '').trim().toLowerCase()
  const password = getArg('password') || process.env.SEED_PASSWORD || ''
  const rol = (getArg('rol') || process.env.SEED_ROL || 'soporte') as RolUsuario
  const tipoOperador = (getArg('tipoOperador') || null) as TipoOperador
  const nombre = getArg('nombre') || process.env.SEED_NOMBRE || ''
  const updateIfExists = ['1', 'true', 'yes'].includes((getArg('update') || process.env.SEED_UPDATE || '').toLowerCase())

  if (!email || !password) {
    console.error('❌ Debes proporcionar --email y --password (o variables SEED_EMAIL / SEED_PASSWORD)')
    process.exit(1)
  }

  // Validar rol
  const rolesValidos: RolUsuario[] = ['administrador', 'operador', 'soporte']
  if (!rolesValidos.includes(rol)) {
    console.error(`❌ Rol inválido. Debe ser: ${rolesValidos.join(', ')}`)
    process.exit(1)
  }

  // Validar tipoOperador si el rol es operador
  if (rol === 'operador' && tipoOperador) {
    const tiposValidos: TipoOperador[] = ['coordinador_masivos', 'director_comercial', 'ejecutivo_horecas', 'mayorista']
    if (!tiposValidos.includes(tipoOperador)) {
      console.error(`❌ Tipo de operador inválido. Debe ser: ${tiposValidos.join(', ')}`)
      process.exit(1)
    }
  }

  const MONGO_URI = process.env.MONGO_URI
  if (!MONGO_URI) {
    console.error('❌ Falta MONGO_URI en el entorno (.env)')
    process.exit(1)
  }

  try {
    await mongoose.connect(MONGO_URI)
    console.log('✅ Conectado a MongoDB')

    const existing = await Usuario.findOne({ email })
    if (existing) {
      if (!updateIfExists) {
        console.log(`ℹ️ El usuario ya existe. Usa --update=true para actualizar.`)
        process.exit(0)
      }
      const passwordHash = await bcrypt.hash(password, 10)
      existing.passwordHash = passwordHash
      existing.rol = rol
      existing.tipoOperador = rol === 'operador' ? tipoOperador : null
      if (nombre) existing.nombre = nombre
      await existing.save()
      console.log(`🔑 Usuario actualizado exitosamente (Rol: ${rol}${tipoOperador ? `, Tipo: ${tipoOperador}` : ''})`)
      process.exit(0)
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = new Usuario({ 
      email, 
      passwordHash, 
      rol,
      tipoOperador: rol === 'operador' ? tipoOperador : null,
      nombre: nombre || email.split('@')[0],
      activo: true
    })
    await user.save()
    console.log(`✅ Usuario creado exitosamente (Rol: ${rol}${tipoOperador ? `, Tipo: ${tipoOperador}` : ''})`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Error en seed:', err)
    process.exit(1)
  }
}

main()
