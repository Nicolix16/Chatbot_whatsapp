const mongoose = require('mongoose');
require('dotenv').config();

// Definir el schema directamente
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

async function actualizarHistorialPedidos() {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGO_URI || '';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Obtener todos los pedidos
    const pedidos = await Pedido.find({});
    console.log(`📦 Encontrados ${pedidos.length} pedidos`);

    let actualizados = 0;

    for (const pedido of pedidos) {
      // Si no tiene historialEstados o está vacío, crear uno con el estado actual
      if (!pedido.historialEstados || pedido.historialEstados.length === 0) {
        pedido.historialEstados = [{
          estado: pedido.estado,
          fecha: pedido.fechaPedido,
          nota: `Estado inicial: ${pedido.estado}`
        }];

        await pedido.save();
        actualizados++;
        console.log(`✅ Actualizado pedido ${pedido.idPedido}`);
      }
    }

    console.log(`\n✅ Proceso completado: ${actualizados} pedidos actualizados de ${pedidos.length} totales`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

actualizarHistorialPedidos();
