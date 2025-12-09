const mongoose = require('mongoose');
require('dotenv').config();

// Definir el schema
const ProductoPedidoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  cantidad: { type: Number, required: true },
  precioUnitario: { type: Number, required: true },
  subtotal: { type: Number, required: true },
}, { _id: false });

const HistorialEstadoSchema = new mongoose.Schema({
  estado: { 
    type: String, 
    enum: ['pendiente', 'en_proceso', 'atendido', 'cancelado'], 
    required: true 
  },
  fecha: { type: Date, default: Date.now },
  operadorEmail: { type: String },
  operadorId: { type: String },
  nota: { type: String }
}, { _id: false });

const PedidoSchema = new mongoose.Schema({
  idPedido: { type: String, required: true, unique: true },
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
    enum: ['pendiente', 'en_proceso', 'atendido', 'cancelado'], 
    default: 'pendiente' 
  },
  fechaPedido: { type: Date, default: Date.now },
  notas: { type: String },
  notasCancelacion: { type: String },
  historialEstados: [HistorialEstadoSchema]
});

const Pedido = mongoose.model('Pedido', PedidoSchema);

async function testPedido() {
  try {
    const mongoUri = process.env.MONGO_URI || '';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Buscar el pedido AV-20251208-7518
    const pedido = await Pedido.findOne({ idPedido: 'AV-20251208-7518' });
    
    if (!pedido) {
      console.log('❌ Pedido no encontrado');
      process.exit(1);
    }

    console.log('\n📦 Pedido encontrado:');
    console.log('ID:', pedido.idPedido);
    console.log('Estado actual:', pedido.estado);
    console.log('Historial de estados:');
    console.log(JSON.stringify(pedido.historialEstados, null, 2));
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPedido();
