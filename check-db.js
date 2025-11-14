import mongoose from 'mongoose';

const ClienteSchema = new mongoose.Schema({
  telefono: String,
  tipoCliente: String,
  nombreNegocio: String,
  ciudad: String,
  personaContacto: String,
  productosInteres: String,
  fechaRegistro: Date,
  ultimaInteraccion: Date,
  conversaciones: Number,
});

const Cliente = mongoose.model('Cliente', ClienteSchema);

async function checkDB() {
  try {
    await mongoose.connect('mongodb+srv://nicolix28:Nicolascabezas16@chatbot.0c5yk7g.mongodb.net/chatbot?retryWrites=true&w=majority&appName=chatbot');
    console.log('✅ Conectado a MongoDB Atlas');
    
    const clientes = await Cliente.find().sort({ fechaRegistro: -1 });
    console.log('\n📊 CLIENTES EN LA BASE DE DATOS:');
    console.log('Total:', clientes.length);
    console.log('\n');
    
    clientes.forEach((c, i) => {
      console.log(`--- Cliente ${i + 1} ---`);
      console.log('Teléfono:', c.telefono);
      console.log('Tipo:', c.tipoCliente);
      console.log('Negocio:', c.nombreNegocio);
      console.log('Ciudad:', c.ciudad);
      console.log('Contacto:', c.personaContacto);
      console.log('Productos:', c.productosInteres);
      console.log('Fecha:', c.fechaRegistro);
      console.log('Última interacción:', c.ultimaInteraccion);
      console.log('Conversaciones:', c.conversaciones);
      console.log('');
    });
    
    await mongoose.connection.close();
    console.log('✅ Conexión cerrada');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDB();
