// Tipos de usuario y autenticación
export type UserRole = 'administrador' | 'soporte' | 'operador' | 'hogares';
export type TipoOperador = 'coordinador_masivos' | 'director_comercial' | 'ejecutivo_horecas' | 'mayorista' | 'encargado_hogares';

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  tipoOperador?: TipoOperador;
  activo: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Tipos de datos del negocio
export type TipoCliente = 'hogar' | 'tienda' | 'asadero' | 'restaurante_estandar' | 'restaurante_premium' | 'mayorista';
export type TipoResponsable = 'coordinador_masivos' | 'director_comercial' | 'ejecutivo_horecas' | 'mayorista';

export interface Cliente {
  _id: string;
  telefono: string;
  nombre?: string;
  tipoCliente: TipoCliente;
  // Datos de negocio
  nombreNegocio?: string;
  ciudad?: string;
  direccion?: string;
  responsable?: TipoResponsable;
  personaContacto?: string;
  productosInteres?: string;
  // Metadata
  fechaRegistro: Date;
  ultimaInteraccion: Date;
  conversaciones: number;
}

export interface Pedido {
  _id: string;
  idPedido: string; // ID legible (ej: PED-001)
  telefono: string;
  nombreNegocio?: string;
  personaContacto?: string;
  tipoCliente: TipoCliente;
  productos: ProductoPedido[];
  total: number;
  estado: 'pendiente' | 'en_proceso' | 'atendido' | 'cancelado';
  fechaPedido: Date;
  // Ubicación
  ciudad?: string;
  direccion?: string;
  // Coordinador asignado
  coordinadorAsignado?: string;
  telefonoCoordinador?: string;
  // Notas
  notas?: string;
  notasCancelacion?: string;
  // Historial de cambios de estado
  historialEstados?: HistorialEstado[];
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  // Campos legacy para compatibilidad
  clienteNumero?: string;
  clienteNombre?: string;
  fechaEntrega?: Date;
  direccionEntrega?: string;
  notasAdicionales?: string;
}

export interface ProductoPedido {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface HistorialEstado {
  estado: 'pendiente' | 'en_proceso' | 'atendido' | 'cancelado';
  fecha: Date;
  operadorEmail?: string;
  nota?: string;
}

export interface Conversacion {
  _id: string;
  telefono: string;
  nombreCliente?: string;
  nombreNegocio?: string;
  tipoCliente?: TipoCliente;
  mensajes: Mensaje[];
  flujoActual?: string;
  fechaUltimoMensaje?: Date;
  // Interacciones importantes
  interaccionesImportantes?: InteraccionImportante[];
  // Cliente info
  clienteInfo?: {
    telefono: string;
    nombreNegocio?: string;
    ciudad?: string;
    tipoCliente?: TipoCliente;
    fechaRegistro?: Date;
  };
  // Metadata
  iniciadaEn: Date;
  ultimoMensaje: Date;
  estado: 'activa' | 'finalizada';
  duracion?: number;
  createdAt: Date;
  updatedAt: Date;
  // Campos legacy
  clienteNumero?: string;
}

export interface Mensaje {
  remitente: 'cliente' | 'bot' | 'operador';
  contenido: string;
  timestamp: Date;
  tipo?: 'texto' | 'imagen' | 'audio' | 'documento';
}

export interface InteraccionImportante {
  tipo: 'registro' | 'contacto_asesor' | 'pedido';
  contenido: string;
  timestamp: Date;
}

export interface Evento {
  _id: string;
  nombre: string;
  mensaje: string;
  imagenUrl?: string;
  filtros: {
    tipo: 'todos' | 'hogar' | 'negocios' | 'ciudad' | 'tipo' | 'personalizado';
    ciudades?: string[];
    tiposCliente?: string[];
  };
  destinatarios: {
    total: number;
    enviados: number;
    fallidos: number;
    lista: Array<{
      telefono: string;
      nombreNegocio?: string;
      ciudad?: string;
      tipoCliente: string;
      enviado: boolean;
      fechaEnvio?: Date;
      error?: string;
    }>;
  };
  estado: 'borrador' | 'enviando' | 'enviado' | 'error';
  fechaCreacion: Date | string;
  fechaEnvio?: Date | string;
  creadoPor: string;
}

// Tipo para logs de eventos del sistema (si se implementa en el futuro)
export interface EventoLog {
  _id: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  categoria: string;
  mensaje: string;
  detalles?: Record<string, any>;
  usuario?: string;
  timestamp: Date | string;
  leido: boolean;
}

export interface Usuario {
  _id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  tipoOperador?: TipoOperador;
  activo: boolean;
  ultimoAcceso?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para filtros y búsqueda
export interface FilterOptions {
  searchTerm?: string;
  estado?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  rol?: UserRole;
  tipoOperador?: TipoOperador;
}

// Tipos para exportación
export type ExportType = 'clientes' | 'pedidos' | 'conversaciones' | 'usuarios' | 'estadisticas' | 'eventos';

export interface ExportOptions {
  type: ExportType;
  format: 'json' | 'csv';
  dateRange?: {
    start: Date;
    end: Date;
  };
}
