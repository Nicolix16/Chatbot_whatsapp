import mongoose, { Schema, Document } from 'mongoose'

export type TipoNotificacion = 'nuevo_pedido' | 'usuario_desactivado' | 'usuario_eliminado'

export interface INotificacion extends Document {
  tipo: TipoNotificacion
  mensaje: string
  usuarioDestinoId: string
  usuarioDestinoEmail: string
  referencia?: {
    tipo: 'pedido' | 'usuario'
    id: string
  }
  leida: boolean
  createdAt: Date
}

const NotificacionSchema: Schema<INotificacion> = new Schema({
  tipo: { 
    type: String, 
    enum: ['nuevo_pedido', 'usuario_desactivado', 'usuario_eliminado'], 
    required: true 
  },
  mensaje: { type: String, required: true },
  usuarioDestinoId: { type: String, required: true },
  usuarioDestinoEmail: { type: String, required: true },
  referencia: {
    tipo: { type: String, enum: ['pedido', 'usuario'] },
    id: { type: String }
  },
  leida: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

// Índices para búsqueda rápida
NotificacionSchema.index({ usuarioDestinoId: 1, createdAt: -1 })
NotificacionSchema.index({ leida: 1 })

export default mongoose.model<INotificacion>('Notificacion', NotificacionSchema)
