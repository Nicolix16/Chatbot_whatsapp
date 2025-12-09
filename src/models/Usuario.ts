import mongoose, { Schema, Document } from 'mongoose'

export type RolUsuario = 'administrador' | 'operador' | 'soporte'
export type TipoOperador = 'coordinador_masivos' | 'director_comercial' | 'ejecutivo_horecas' | 'mayorista' | null

export interface IUsuario extends Document {
  email: string
  passwordHash: string
  rol: RolUsuario
  tipoOperador?: TipoOperador
  refreshToken?: string
  activo: boolean
  nombre?: string
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  createdAt: Date
  updatedAt: Date
}

const UsuarioSchema: Schema<IUsuario> = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  rol: { 
    type: String, 
    enum: ['administrador', 'operador', 'soporte'], 
    default: 'soporte',
    required: true 
  },
  tipoOperador: {
    type: String,
    enum: ['coordinador_masivos', 'director_comercial', 'ejecutivo_horecas', 'mayorista', null],
    default: null
  },
  refreshToken: { type: String },
  activo: { type: Boolean, default: true },
  nombre: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Middleware para actualizar updatedAt
UsuarioSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.model<IUsuario>('Usuario', UsuarioSchema)