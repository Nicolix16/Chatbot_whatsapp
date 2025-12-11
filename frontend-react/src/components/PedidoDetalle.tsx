import { useState, useEffect } from 'react';
import type { Pedido } from '../types';
import { pedidosService } from '../services/pedidos.service';
import { useAuth } from '../contexts/AuthContext';
import './PedidoDetalle.css';
import type { ReactElement } from 'react';

interface PedidoDetalleProps {
  pedidoId: string;
  onClose: () => void;
  onUpdate: () => void;
}

const TIPO_OPERADOR_TEXTO: Record<string, string> = {
  'coordinador_masivos': 'Coordinador de Masivos',
  'director_comercial': 'Director Comercial',
  'ejecutivo_horecas': 'Ejecutivo de Horecas',
  'mayorista': 'Asesor de Mayoristas'
};

const ESTADO_MAP: Record<string, { iconSvg: ReactElement; color: string; label: string }> = {
  'pendiente': { 
    iconSvg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    color: '#f59e0b', 
    label: 'Pendiente' 
  },
  'en_proceso': { 
    iconSvg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    color: '#3b82f6', 
    label: 'En Proceso' 
  },
  'atendido': { 
    iconSvg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    color: '#22c55e', 
    label: 'Atendido' 
  },
  'cancelado': { 
    iconSvg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    color: '#ef4444', 
    label: 'Cancelado' 
  }
};

export function PedidoDetalle({ pedidoId, onClose, onUpdate }: PedidoDetalleProps) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadPedido();
  }, [pedidoId]);

  const loadPedido = async () => {
    try {
      const data = await pedidosService.getById(pedidoId);
      setPedido(data);
      
      // Generar mensaje para el cliente
      if (data) {
        const nombreOperador = TIPO_OPERADOR_TEXTO[user?.tipoOperador || ''] || 'Asesor Comercial';
        const productosTexto = data.productos.map(p => 
          `- ${p.cantidad} ${p.nombre} ($${p.precioUnitario.toLocaleString('es-CO')} c/u)`
        ).join('\n');
        
        const mensajeInicial = `Hola, soy tu asesor de Avellano, más específicamente ${nombreOperador}. Yo seré el encargado de que tu pedido con ID *${data.idPedido}* sea entregado correctamente.

*Dirección de entrega:* ${data.direccion || 'No especificada'}, ${data.ciudad || ''}

*Tu pedido consta de:*
${productosTexto}

*Total: $${data.total.toLocaleString('es-CO')}*

En breve me pondré en contacto contigo para confirmar los detalles y coordinar la entrega. ¡Gracias por tu preferencia!`;
        
        setMensaje(mensajeInicial);
      }
    } catch (error) {
      console.error('Error cargando pedido:', error);
      alert('Error cargando el pedido');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleTomarPedido = async () => {
    if (!pedido) return;
    
    if (!confirm('¿Deseas tomar este pedido? Se cambiará el estado a "En Proceso" y se notificará al cliente por WhatsApp')) {
      return;
    }

    try {
      await pedidosService.tomarPedido(pedido._id);
      
      // Enviar mensaje de WhatsApp
      try {
        await pedidosService.enviarMensajeWhatsApp(
          pedido.telefono,
          'Su pedido ya está siendo atendido por un asesor comercial. En breve se comunicará con usted para confirmar el pedido y realizar el pago del mismo. ¡Gracias por su preferencia!'
        );
        alert('Pedido tomado exitosamente y cliente notificado por WhatsApp');
      } catch (whatsappError) {
        console.error('Error enviando WhatsApp:', whatsappError);
        alert('Pedido tomado exitosamente. No se pudo enviar notificación por WhatsApp');
      }
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error tomando pedido:', error);
      alert('Error al tomar el pedido');
    }
  };

  const handleCompletarPedido = async () => {
    if (!pedido) return;
    
    if (!confirm('¿Marcar este pedido como ATENDIDO?')) {
      return;
    }

    try {
      await pedidosService.completarPedido(pedido._id);
      alert('Pedido marcado como atendido');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error completando pedido:', error);
      alert('Error al completar el pedido');
    }
  };

  const handleCancelarPedido = async () => {
    if (!pedido) return;
    
    const motivo = prompt('¿Por qué deseas cancelar este pedido?');
    if (!motivo) return;

    try {
      await pedidosService.cancelarPedido(pedido._id, motivo);
      alert('Pedido cancelado');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error cancelando pedido:', error);
      alert('Error al cancelar el pedido');
    }
  };

  const handleCopiarMensaje = () => {
    navigator.clipboard.writeText(mensaje)
      .then(() => {
        alert('Mensaje copiado al portapapeles');
      })
      .catch(() => {
        alert('No se pudo copiar el mensaje');
      });
  };

  const handleAbrirWhatsApp = () => {
    if (!pedido) return;
    
    const mensajeEncoded = encodeURIComponent(mensaje);
    const telefonoLimpio = pedido.telefono.replace(/\D/g, '');
    const whatsappLink = `https://wa.me/${telefonoLimpio}?text=${mensajeEncoded}`;
    window.open(whatsappLink, '_blank');
  };

  if (isLoading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content-pedido" onClick={(e) => e.stopPropagation()}>
          <div className="loading">Cargando pedido...</div>
        </div>
      </div>
    );
  }

  if (!pedido) return null;

  const estadoInfo = ESTADO_MAP[pedido.estado] || { iconSvg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><text x="12" y="16" textAnchor="middle" fill="currentColor" fontSize="12">?</text></svg>, color: '#999', label: pedido.estado };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-pedido" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-pedido">
          <div className="pedido-header-content">
            <h2 className="pedido-id">{pedido.idPedido}</h2>
            <span className={`badge badge-${pedido.estado} badge-large`}>
              {estadoInfo.iconSvg} {estadoInfo.label.toUpperCase()}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body-pedido">
          <div className="pedido-fecha">
          <svg className="date-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {new Date(pedido.fecha).toLocaleString('es-CO', {
            weekday: 'long',
            year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>

          {/* Información del Cliente */}
          <div className="pedido-section">
            <h3 className="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Información del Cliente
            </h3>
            <div className="cliente-info-cards">
              <div className="cliente-info-card">
                <div className="info-card-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="info-card-title">Negocio</span>
                </div>
                <div className="info-card-value">{pedido.nombreNegocio || 'No especificado'}</div>
                <div className="info-card-subtitle">{pedido.tipoCliente?.replace(/_/g, ' ').toUpperCase()}</div>
              </div>
              
              <div className="cliente-info-card">
                <div className="info-card-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span className="info-card-title">Contacto</span>
                </div>
                <div className="info-card-value">{pedido.personaContacto || 'No especificado'}</div>
                <div className="info-card-subtitle">{pedido.telefono}</div>
              </div>
              
              <div className="cliente-info-card full-width">
                <div className="info-card-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span className="info-card-title">Dirección de Entrega</span>
                </div>
                <div className="info-card-value">{pedido.direccion || 'No especificada'}</div>
                <div className="info-card-subtitle">{pedido.ciudad || 'Ciudad no especificada'}</div>
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="pedido-section">
            <h3 className="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 16V8C20.9996 7.64927 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64927 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.27 6.96L12 12.01L20.73 6.96M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Productos del Pedido
            </h3>
            <table className="productos-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pedido.productos.map((producto, index) => (
                  <tr key={index}>
                    <td><strong>{producto.nombre}</strong></td>
                    <td className="text-center">{producto.cantidad}</td>
                    <td className="text-right">${producto.precioUnitario.toLocaleString('es-CO')}</td>
                    <td className="text-right"><strong>${producto.subtotal.toLocaleString('es-CO')}</strong></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td colSpan={3}><strong>TOTAL</strong></td>
                  <td className="text-right"><strong className="total-price">${pedido.total.toLocaleString('es-CO')}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Coordinador Asignado */}
            {pedido.coordinadorAsignado && (
              <div className="pedido-section">
                <h3 className="section-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Coordinador Asignado
                </h3>
                <div className="coordinador-info">
                  <div className="coordinador-nombre">{pedido.coordinadorAsignado}</div>
                  <div className="coordinador-tel">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22 16.92V19.92C22 20.4828 21.5523 20.9524 20.9913 20.9928C20.0804 21.0566 19.2651 20.9788 18.5476 20.7596C16.4856 20.1424 14.5937 18.9886 13.0476 17.4424C11.5015 15.8963 10.3477 14.0044 9.73048 11.9424C9.51142 11.2249 9.43355 10.4096 9.49719 9.49871C9.53771 8.93771 10.0072 8.49002 10.57 8.49002H13.57C13.8383 8.49002 14.0812 8.65597 14.1765 8.90493C14.2658 9.13823 14.361 9.38367 14.4624 9.64009C14.8313 10.5654 15.3117 11.4304 15.8924 12.2176C16.0131 12.3757 15.9893 12.5991 15.8376 12.7308L14.8824 13.5876C15.7218 15.1654 17.1346 16.5782 18.7124 17.4176L19.5692 16.4624C19.7009 16.3107 19.9243 16.287 20.0824 16.4076C20.8697 16.9883 21.7347 17.4687 22.66 17.8376C22.9164 17.939 23.1619 18.0342 23.3952 18.1235C23.6441 18.2188 23.81 18.4617 23.81 18.73V18.73Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {pedido.telefonoCoordinador}
                  </div>
                </div>
              </div>
            )}          {/* Historial de Estados */}
          {pedido.historialEstados && pedido.historialEstados.length > 0 && (
            <div className="pedido-section">
              <h3 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Historial de Estados
              </h3>
              <div className="timeline">
                {pedido.historialEstados.map((cambio, index) => {
                  const estadoCambio = ESTADO_MAP[cambio.estado];
                  const isLast = index === pedido.historialEstados!.length - 1;
                  
                  return (
                    <div key={index} className={`timeline-item ${isLast ? 'current' : ''}`}>
                      <div className="timeline-marker" style={{ background: estadoCambio.color }}>
                        {estadoCambio.icon}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-title" style={{ color: estadoCambio.color }}>
                          {estadoCambio.label}
                        </div>
                        <div className="timeline-date">
                          {new Date(cambio.fecha).toLocaleString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {cambio.operadorEmail && (
                          <div className="timeline-operator">
                            {cambio.operadorEmail}
                          </div>
                        )}
                        {cambio.nota && (
                          <div className="timeline-note">
                            {cambio.nota}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notas */}
          {pedido.notas && (
            <div className="pedido-section">
              <h3 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Notas
              </h3>
              <div className="pedido-notas">{pedido.notas}</div>
            </div>
          )}

          {/* Motivo de Cancelación */}
          {pedido.estado === 'cancelado' && pedido.notasCancelacion && (
            <div className="pedido-section cancelacion">
              <h3 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Motivo de Cancelación
              </h3>
              <div className="pedido-notas">{pedido.notasCancelacion}</div>
            </div>
          )}

          {/* Mensaje para el Cliente (solo si está en proceso) */}
          {pedido.estado === 'en_proceso' && (
            <div className="pedido-section mensaje-cliente-section">
              <h3 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Mensaje para el Cliente
              </h3>
              <div className="mensaje-container">
                <textarea
                  className="mensaje-textarea"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                />
                <div className="mensaje-botones">
                  <button className="btn-copiar" onClick={handleCopiarMensaje}>
                    Copiar Mensaje
                  </button>
                  <button className="btn-whatsapp" onClick={handleAbrirWhatsApp}>
                    Abrir en WhatsApp
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="modal-footer-pedido">
          {pedido.estado === 'pendiente' && (
            <button className="btn-tomar-pedido" onClick={handleTomarPedido}>
              Tomar Pedido
            </button>
          )}
          
          {pedido.estado === 'en_proceso' && (
            <>
              <button className="btn-completar" onClick={handleCompletarPedido}>
                Marcar como Atendido
              </button>
              <button className="btn-cancelar" onClick={handleCancelarPedido}>
                Cancelar Pedido
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
