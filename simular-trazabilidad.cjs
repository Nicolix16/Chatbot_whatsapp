const mongoose = require('mongoose');
require('dotenv').config();

// Definir schemas
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

async function simularTrazabilidad() {
  try {
    const mongoUri = process.env.MONGO_URI || '';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Buscar el pedido AV-20251208-9828
    const pedido = await Pedido.findOne({ idPedido: 'AV-20251208-9828' });
    
    if (!pedido) {
      console.log('❌ Pedido no encontrado');
      process.exit(1);
    }

    console.log(`\n📦 Actualizando pedido: ${pedido.idPedido}`);
    console.log(`Estado actual: ${pedido.estado}\n`);

    // Limpiar historial y crear uno completo de ejemplo
    const ahora = new Date();
    const hace2Horas = new Date(ahora.getTime() - 2 * 60 * 60 * 1000);
    const hace1Hora = new Date(ahora.getTime() - 1 * 60 * 60 * 1000);

    pedido.historialEstados = [
      {
        estado: 'pendiente',
        fecha: pedido.fechaPedido,
        nota: 'Pedido recibido desde el chatbot'
      },
      {
        estado: 'en_proceso',
        fecha: hace2Horas,
        operadorEmail: 'operacion@avellano.com',
        operadorId: '67355e5b1c56ad5c1af57c5d',
        nota: 'Pedido tomado por el operador'
      },
      {
        estado: 'atendido',
        fecha: hace1Hora,
        operadorEmail: 'operacion@avellano.com',
        operadorId: '67355e5b1c56ad5c1af57c5d',
        nota: 'Pedido completado y entregado al cliente'
      }
    ];

    pedido.estado = 'atendido';
    
    await pedido.save();

    console.log('✅ Historial actualizado exitosamente');
    console.log('\n📊 Historial de estados:');
    pedido.historialEstados.forEach((h, i) => {
      console.log(`\n${i + 1}. ${h.estado.toUpperCase()}`);
      console.log(`   Fecha: ${h.fecha.toLocaleString('es-CO')}`);
      if (h.operadorEmail) {
        console.log(`   Operador: ${h.operadorEmail}`);
        console.log(`   ID: ${h.operadorId}`);
      } else {
        console.log(`   Sistema automático`);
      }
      if (h.nota) console.log(`   Nota: ${h.nota}`);
    });
    
    console.log('\n✅ Ahora recarga el dashboard y verás la trazabilidad completa\n');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

simularTrazabilidad();
