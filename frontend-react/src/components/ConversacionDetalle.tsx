import { useState, useEffect } from 'react';
import type { Conversacion, Pedido } from '../types';
import { conversacionesService } from '../services/conversaciones.service';
import { pedidosService } from '../services/pedidos.service';
import './ConversacionDetalle.css';
import type { ReactElement } from 'react';

interface ConversacionDetalleProps {
  telefono: string;
  onClose: () => void;
}

type SeccionActiva = 'pedidos' | 'registros' | 'contactos';

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

export function ConversacionDetalle({ telefono, onClose }: ConversacionDetalleProps) {
  const [conversacion, setConversacion] = useState<Conversacion | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [seccionActiva, setSeccionActiva] = useState<SeccionActiva>('pedidos');
  const [pedidoExpandido, setPedidoExpandido] = useState<string | null>(null);

  useEffect(() => {
    loadConversacion();
    loadPedidos();
  }, [telefono]);

  const loadConversacion = async () => {
    try {
      const data = await conversacionesService.getByTelefono(telefono);
      setConversacion(data);
    } catch (error) {
      console.error('Error cargando conversación:', error);
      alert('❌ Error cargando conversación');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const loadPedidos = async () => {
    try {
      const data = await pedidosService.getByCliente(telefono);
      setPedidos(data);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    }
  };

  const togglePedido = (pedidoId: string) => {
    setPedidoExpandido(pedidoExpandido === pedidoId ? null : pedidoId);
  };

  if (isLoading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content-conversacion" onClick={(e) => e.stopPropagation()}>
          <div className="loading">Cargando conversación...</div>
        </div>
      </div>
    );
  }

  if (!conversacion) return null;

  const nombreDisplay = conversacion.nombreNegocio || conversacion.nombreCliente || telefono;
  const registros = conversacion.interaccionesImportantes?.filter(i => i.tipo === 'registro') || [];
  const contactos = conversacion.interaccionesImportantes?.filter(i => i.tipo === 'contacto_asesor') || [];
  const totalMensajes = conversacion.mensajes?.length || 0;
  const ultimaInteraccion = conversacion.fechaUltimoMensaje
    ? new Date(conversacion.fechaUltimoMensaje).toLocaleString('es-CO')
    : 'Sin registro';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-conversacion" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-conversacion">
          <h2>Conversación con {nombreDisplay}</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body-conversacion">
          {/* Resumen de interacciones */}
          <div className="resumen-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Resumen de Interacciones
            </h3>
            <div className="tabs-row">
              <div
                className={`tab-card ${seccionActiva === 'pedidos' ? 'active' : ''}`}
                onClick={() => setSeccionActiva('pedidos')}
              >
                <div className="tab-value">{pedidos.length}</div>
                <div className="tab-label">Pedidos</div>
              </div>
              <div
                className={`tab-card ${seccionActiva === 'registros' ? 'active' : ''}`}
                onClick={() => setSeccionActiva('registros')}
              >
                <div className="tab-value">{registros.length}</div>
                <div className="tab-label">Registros</div>
              </div>
              <div
                className={`tab-card ${seccionActiva === 'contactos' ? 'active' : ''}`}
                onClick={() => setSeccionActiva('contactos')}
              >
                <div className="tab-value">{contactos.length}</div>
                <div className="tab-label">Contactos</div>
              </div>
            </div>
          </div>

          {/* Contenido de secciones */}
          <div className="seccion-contenido">
            {seccionActiva === 'pedidos' && (
              <div className="seccion-pedidos">
                <h4>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 16V8C20.9996 7.64927 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64927 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3.27 6.96L12 12.01L20.73 6.96M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Historial de Pedidos
                </h4>
                {pedidos.length === 0 ? (
                  <div className="empty-state-sm">
                    <svg className="empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 16V8C20.9996 7.64927 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64927 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3.27 6.96L12 12.01L20.73 6.96M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p>No hay pedidos registrados para este cliente</p>
                  </div>
                ) : (
                  pedidos.map((pedido) => {
                    const estadoInfo = ESTADO_MAP[pedido.estado];
                    const isExpanded = pedidoExpandido === pedido._id;

                    return (
                      <div key={pedido._id} className="pedido-card">
                        <div
                          className="pedido-header"
                          onClick={() => togglePedido(pedido._id)}
                        >
                          <div className="pedido-header-info">
                            <strong>{pedido.idPedido}</strong>
                            <span
                              className="badge-small"
                              style={{ background: estadoInfo.color, color: 'white' }}
                            >
                              {estadoInfo.icon} {estadoInfo.label}
                            </span>
                          </div>
                          <div className="pedido-header-right">
                            <div className="pedido-total">
                              ${pedido.total.toLocaleString('es-CO')}
                            </div>
                            <div className="pedido-fecha">
                              {new Date(pedido.fechaPedido).toLocaleDateString('es-CO')}
                            </div>
                            <div className="expand-icon">{isExpanded ? '▲' : '▼'}</div>
                          </div>
                        </div>

                        {isExpanded && pedido.historialEstados && (
                          <div className="pedido-detalle-expanded">
                            <div className="timeline-mini">
                              {pedido.historialEstados.map((cambio, idx) => {
                                const est = ESTADO_MAP[cambio.estado];
                                return (
                                  <div key={idx} className="timeline-item-mini">
                                    <div
                                      className="timeline-marker-mini"
                                      style={{ background: est.color }}
                                    >
                                      {est.icon}
                                    </div>
                                    <div className="timeline-content-mini">
                                      <div style={{ color: est.color, fontWeight: 600 }}>
                                        {est.label}
                                      </div>
                                      <div className="timeline-date-mini">
                                        {new Date(cambio.fecha).toLocaleString('es-CO')}
                                      </div>
                                      {cambio.operadorEmail && (
                                        <div className="timeline-operator-mini">
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                          </svg>
                                          {cambio.operadorEmail}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {seccionActiva === 'registros' && (
              <div className="seccion-registros">
                <h4>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Información de Registro
                </h4>
                <div className="info-box">
                  <div className="info-row-conv">
                    <div className="info-item-conv">
                      <div className="info-label-conv">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Fecha de Registro
                      </div>
                      <div className="info-value-conv">
                        {conversacion.clienteInfo?.fechaRegistro
                          ? new Date(conversacion.clienteInfo.fechaRegistro).toLocaleString('es-CO')
                          : 'No disponible'}
                      </div>
                    </div>
                    <div className="info-item-conv">
                      <div className="info-label-conv">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Última Interacción
                      </div>
                      <div className="info-value-conv">{ultimaInteraccion}</div>
                    </div>
                  </div>
                  <div className="total-mensajes">
                    <div className="total-mensajes-label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Total de Interacciones
                    </div>
                    <div className="total-mensajes-value">{totalMensajes}</div>
                  </div>
                </div>

                {registros.length > 0 && (
                  <div className="eventos-list">
                    <strong>📋 Eventos de Registro:</strong>
                    {registros.map((registro, idx) => (
                      <div key={idx} className="evento-item registro">
                        <div className="evento-contenido">
                          {registro.contenido || 'Registro completado'}
                        </div>
                        <div className="evento-fecha">
                          {new Date(registro.timestamp).toLocaleString('es-CO')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {seccionActiva === 'contactos' && (
              <div className="seccion-contactos">
                <h4>📞 Solicitudes de Contacto</h4>
                {contactos.length === 0 ? (
                  <div className="empty-state-small">
                    <div className="empty-icon">📞</div>
                    <p>No hay solicitudes de contacto registradas</p>
                  </div>
                ) : (
                  <div className="eventos-list">
                    {contactos.map((contacto, idx) => (
                      <div key={idx} className="evento-item contacto">
                        <div className="evento-badge">📞 Contacto con Asesor</div>
                        <div className="evento-contenido">
                          {contacto.contenido || 'Solicitud de contacto'}
                        </div>
                        <div className="evento-fecha">
                          {new Date(contacto.timestamp).toLocaleString('es-CO')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Estadísticas adicionales */}
          <div className="estadisticas-adicionales">
            <h4>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 20V10M12 20V4M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Estadísticas de Interacción
            </h4>
            <div className="stats-grid">
              <div className="stat-item">
                <strong>Total de mensajes:</strong> {totalMensajes}
              </div>
              <div className="stat-item">
                <strong>Última interacción:</strong> {ultimaInteraccion}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
