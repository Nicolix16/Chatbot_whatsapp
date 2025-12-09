import mongoose, { Schema, Document } from 'mongoose'

export interface IDestinatario {
  telefono: string
  nombreNegocio?: string
  ciudad?: string
  tipoCliente: string
  enviado: boolean
  fechaEnvio?: Date
  error?: string
}

export interface IEvento extends Document {
  nombre: string
  mensaje: string
  imagenUrl?: string
  filtros: {
    tipo: 'todos' | 'ciudad' | 'tipo' | 'personalizado'
    ciudades?: string[]
    tiposCliente?: string[]
  }
  destinatarios: {
    total: number
    enviados: number
    fallidos: number
    lista: IDestinatario[]
  }
  estado: 'borrador' | 'enviando' | 'enviado' | 'error'
  fechaCreacion: Date
  fechaEnvio?: Date
  creadoPor: string
}

const DestinatarioSchema = new Schema({
  telefono: { type: String, required: true },
  nombreNegocio: { type: String },
  ciudad: { type: String },
  tipoCliente: { type: String, required: true },
  enviado: { type: Boolean, default: false },
  fechaEnvio: { type: Date },
  error: { type: String },
}, { _id: false })

const EventoSchema: Schema = new Schema({
  nombre: { type: String, required: true },
  mensaje: { type: String, required: true },
  imagenUrl: { type: String },
  filtros: {
    tipo: { 
      type: String, 
      enum: ['todos', 'ciudad', 'tipo', 'personalizado'],
      required: true 
    },
    ciudades: [{ type: String }],
    tiposCliente: [{ type: String }],
  },
  destinatarios: {
    total: { type: Number, default: 0 },
    enviados: { type: Number, default: 0 },
    fallidos: { type: Number, default: 0 },
    lista: [DestinatarioSchema],
  },
  estado: { 
    type: String, 
    enum: ['borrador', 'enviando', 'enviado', 'error'],
    default: 'borrador' 
  },
  fechaCreacion: { type: Date, default: Date.now },
  fechaEnvio: { type: Date },
  creadoPor: { type: String, required: true },
})

// Índices para búsqueda
EventoSchema.index({ fechaCreacion: -1 })
EventoSchema.index({ estado: 1 })

export default mongoose.model<IEvento>('Evento', EventoSchema)
