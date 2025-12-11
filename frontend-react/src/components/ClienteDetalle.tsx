import { useState, useEffect } from 'react';
import type { Cliente } from '../types';
import { clientesService } from '../services/clientes.service';
import { pedidosService } from '../services/pedidos.service';
import type { Pedido } from '../types';
import './ClienteDetalle.css';

interface ClienteDetalleProps {
  telefono: string;
  onClose: () => void;
}

const RESPONSABLE_MAP: Record<string, string> = {
  'coordinador_masivos': 'Coordinador de Masivos',
  'director_comercial': 'Director Comercial',
  'ejecutivo_horecas': 'Ejecutivo Horecas',
  'mayorista': 'Coordinador Mayoristas'
};

export function ClienteDetalle({ telefono, onClose }: ClienteDetalleProps) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCliente();
    loadPedidosCliente();
  }, [telefono]);

  const loadCliente = async () => {
    try {
      const data = await clientesService.getByTelefono(telefono);
      setCliente(data);
    } catch (error) {
      console.error('Error cargando cliente:', error);
      alert('Error cargando información del cliente');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const loadPedidosCliente = async () => {
    try {
      const data = await pedidosService.getByCliente(telefono);
      setPedidos(data);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content-cliente" onClick={(e) => e.stopPropagation()}>
          <div className="loading">Cargando información del cliente...</div>
        </div>
      </div>
    );
  }

  if (!cliente) return null;

  const TipoIcon = cliente.tipoCliente === 'hogar' 
    ? <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    : <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M9 3V21M3 9H21M3 15H21M15 3V21" stroke="currentColor" strokeWidth="2"/>
      </svg>;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-cliente" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-cliente">
          <div className="header-content">
            <div className="header-icon-large">{TipoIcon}</div>
            <div>
              <h2 className="negocio-nombre">{cliente.nombreNegocio || cliente.nombre || 'Sin nombre'}</h2>
              <div className="header-badges">
                <span className="badge-pill badge-tipo">
                  {cliente.tipoCliente === 'hogar' ? 'Hogar' : cliente.tipoCliente.replace(/_/g, ' ')}
                </span>
                <span className="badge-pill badge-resp">
                  {RESPONSABLE_MAP[cliente.responsable || ''] || 'Sin asignar'}
                </span>
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="modal-body-cliente">
          {/* Sección de contacto */}
          <div className="section-contacto">
            <div className="contact-item">
              <div className="contact-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 16.92V19.92C22 20.4828 21.5523 20.9524 20.9913 20.9928C20.0804 21.0566 19.2651 20.9788 18.5476 20.7596C16.4856 20.1424 14.5937 18.9886 13.0476 17.4424C11.5015 15.8963 10.3477 14.0044 9.73048 11.9424C9.51142 11.2249 9.43355 10.4096 9.49719 9.49871C9.53771 8.93771 10.0072 8.49002 10.57 8.49002H13.57C13.8383 8.49002 14.0812 8.65597 14.1765 8.90493C14.2658 9.13823 14.361 9.38367 14.4624 9.64009C14.8313 10.5654 15.3117 11.4304 15.8924 12.2176C16.0131 12.3757 15.9893 12.5991 15.8376 12.7308L14.8824 13.5876C15.7218 15.1654 17.1346 16.5782 18.7124 17.4176L19.5692 16.4624C19.7009 16.3107 19.9243 16.287 20.0824 16.4076C20.8697 16.9883 21.7347 17.4687 22.66 17.8376C22.9164 17.939 23.1619 18.0342 23.3952 18.1235C23.6441 18.2188 23.81 18.4617 23.81 18.73V18.73Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="contact-details">
                <span className="contact-label">Teléfono</span>
                <span className="contact-value">{cliente.telefono}</span>
              </div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="contact-details">
                <span className="contact-label">Persona de Contacto</span>
                <span className="contact-value">{cliente.personaContacto || 'No especificado'}</span>
              </div>
            </div>
          </div>

          {/* Grid de información */}
          <div className="info-grid-cliente">
            {/* Ubicación */}
            <div className="info-section">
              <div className="section-header">
                <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <h3 className="section-title">Ubicación</h3>
              </div>
              <div className="section-body">
                <div className="info-row">
                  <span className="info-label">Ciudad:</span>
                  <span className="info-value">{cliente.ciudad || 'No especificada'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Dirección:</span>
                  <span className="info-value">{cliente.direccion || 'No especificada'}</span>
                </div>
              </div>
            </div>

            {/* Actividad */}
            <div className="info-section">
              <div className="section-header">
                <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <h3 className="section-title">Actividad</h3>
              </div>
              <div className="section-body">
                <div className="info-row">
                  <span className="info-label">Registro:</span>
                  <span className="info-value">
                    {new Date(cliente.fechaRegistro).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Última interacción:</span>
                  <span className="info-value">
                    {new Date(cliente.ultimaInteraccion).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Productos de interés */}
          {cliente.productosInteres && (
            <div className="productos-section">
              <div className="section-header">
                <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 16V8C20.9996 7.64927 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64927 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.27 6.96L12 12.01L20.73 6.96M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3 className="section-title">Productos de Interés</h3>
              </div>
              <div className="productos-content">
                <p className="productos-text">{cliente.productosInteres}</p>
              </div>
            </div>
          )}

          {/* Pedidos del cliente */}
          {pedidos.length > 0 && (
            <div className="pedidos-section">
              <div className="section-header">
                <svg className="section-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3 className="section-title">Pedidos ({pedidos.length})</h3>
              </div>
              <div className="pedidos-list">
                {pedidos.slice(0, 5).map((pedido) => (
                  <div key={pedido._id} className="pedido-item">
                    <div className="pedido-info">
                      <strong>{pedido.idPedido}</strong>
                      <span className={`badge badge-${pedido.estado}`}>
                        {pedido.estado.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="pedido-monto">
                      ${pedido.total.toLocaleString('es-CO')}
                    </div>
                    <div className="pedido-fecha">
                      {new Date(pedido.fechaPedido).toLocaleDateString('es-CO')}
                    </div>
                  </div>
                ))}
                {pedidos.length > 5 && (
                  <div className="more-pedidos">
                    +{pedidos.length - 5} pedidos más
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="stats-row-cliente">
            <div className="stat-card-cliente">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{cliente.conversaciones || 0}</span>
                <span className="stat-label">Conversaciones</span>
              </div>
            </div>
            <div className="stat-card-cliente">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="9" cy="21" r="1" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="20" cy="21" r="1" stroke="currentColor" strokeWidth="2"/>
                  <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{pedidos.length}</span>
                <span className="stat-label">Pedidos</span>
              </div>
            </div>
            <div className="stat-card-cliente">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.59 13.41L13.42 20.58C13.2343 20.766 13.0137 20.9135 12.7709 21.0141C12.5281 21.1148 12.2678 21.1666 12.005 21.1666C11.7422 21.1666 11.4819 21.1148 11.2391 21.0141C10.9963 20.9135 10.7757 20.766 10.59 20.58L2 12V2H12L20.59 10.59C20.9625 10.9647 21.1716 11.4716 21.1716 12C21.1716 12.5284 20.9625 13.0353 20.59 13.41Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 7H7.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{cliente._id.substring(0, 8)}...</span>
                <span className="stat-label">ID Cliente</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
