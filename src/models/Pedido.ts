import mongoose, { Schema, Document } from 'mongoose'

export interface IProductoPedido {
  nombre: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface IPedido extends Document {
  telefono: string
  tipoCliente: string
  nombreNegocio?: string
  ciudad?: string
  direccion?: string
  personaContacto?: string
  productos: IProductoPedido[]
  total: number
  coordinadorAsignado: string
  telefonoCoordinador: string
  estado: 'pendiente' | 'enviado' | 'procesado' | 'cancelado'
  fechaPedido: Date
  notas?: string
}

const ProductoPedidoSchema = new Schema({
  nombre: { type: String, required: true },
  cantidad: { type: Number, required: true },
  precioUnitario: { type: Number, required: true },
  subtotal: { type: Number, required: true },
}, { _id: false })

const PedidoSchema: Schema = new Schema({
  telefono: { type: String, required: true },
  tipoCliente: { type: String, required: true },
  nombreNegocio: { type: String },
  ciudad: { type: String },
  direccion: { type: String },
  personaContacto: { type: String },
  productos: [ProductoPedidoSchema],
  total: { type: Number, required: true },
  coordinadorAsignado: { type: String, required: true },
  telefonoCoordinador: { type: String, required: true },
  estado: { 
    type: String, 
    enum: ['pendiente', 'enviado', 'procesado', 'cancelado'], 
    default: 'pendiente' 
  },
  fechaPedido: { type: Date, default: Date.now },
  notas: { type: String },
})

export default mongoose.model<IPedido>('Pedido', PedidoSchema)
