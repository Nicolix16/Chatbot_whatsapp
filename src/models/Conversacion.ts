import mongoose, { Schema, Document } from 'mongoose'

export interface IConversacion extends Document {
  telefono: string
  nombreCliente?: string
  nombreNegocio?: string
  mensajes: {
    rol: 'usuario' | 'bot'
    mensaje: string
    timestamp: Date
    tipoInteraccion?: 'pedido' | 'registro' | 'info_general' | 'recetas' | 'atencion' | 'general'
  }[]
  flujoActual: string
  interaccionesImportantes: {
    tipo: 'pedido' | 'registro' | 'contacto_asesor'
    contenido: string
    timestamp: Date
  }[]
  fechaInicio: Date
  fechaUltimoMensaje: Date
}

const ConversacionSchema: Schema = new Schema({
  telefono: { type: String, required: true },
  nombreCliente: { type: String },
  nombreNegocio: { type: String },
  mensajes: [{
    rol: { type: String, enum: ['usuario', 'bot'], required: true },
    mensaje: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    tipoInteraccion: { 
      type: String, 
      enum: ['pedido', 'registro', 'info_general', 'recetas', 'atencion', 'general']
    },
  }],
  flujoActual: { type: String },
  interaccionesImportantes: [{
    tipo: { type: String, enum: ['pedido', 'registro', 'contacto_asesor'], required: true },
    contenido: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  }],
  fechaInicio: { type: Date, default: Date.now },
  fechaUltimoMensaje: { type: Date, default: Date.now },
})

export default mongoose.model<IConversacion>('Conversacion', ConversacionSchema)
