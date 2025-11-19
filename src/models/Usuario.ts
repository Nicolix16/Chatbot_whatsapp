import mongoose, { Schema, Document } from 'mongoose'

export type RolUsuario = 'administrador' | 'operario' | 'visitante'

export interface IUsuario extends Document {
  email: string
  passwordHash: string
  rol: RolUsuario
  refreshToken?: string
  activo: boolean
  nombre?: string
  createdAt: Date
  updatedAt: Date
}

const UsuarioSchema: Schema<IUsuario> = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  rol: { 
    type: String, 
    enum: ['administrador', 'operario', 'visitante'], 
    default: 'visitante',
    required: true 
  },
  refreshToken: { type: String },
  activo: { type: Boolean, default: true },
  nombre: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Middleware para actualizar updatedAt
UsuarioSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.model<IUsuario>('Usuario', UsuarioSchema)