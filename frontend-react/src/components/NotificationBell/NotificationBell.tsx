import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_CONFIG } from '../../config/api';
import './NotificationBell.css';

interface Notification {
  id: string;
  type: 'clientes' | 'pedidos' | 'conversaciones' | 'eventos';
  message: string;
  timestamp: Date;
  read: boolean;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [lastCounts, setLastCounts] = useState({
    clientes: 0,
    pedidos: 0,
    conversaciones: 0,
    eventos: 0
  });
  const { user } = useAuth();
  const navigate = useNavigate();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    // Verificación inicial (sin crear notificaciones)
    checkForUpdates(true);
    
    // Verificar actualizaciones cada 15 segundos
    const interval = setInterval(() => checkForUpdates(false), 15000);
    
    return () => clearInterval(interval);
  }, [user]);

  const checkForUpdates = async (isInitial: boolean = false) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      console.log('🔔 Verificando actualizaciones...', { isInitial, user: user.nombre });

      // Obtener conteos actuales de cada endpoint
      const [clientesRes, pedidosRes, conversacionesRes, eventosRes] = await Promise.all([
        fetch(`${API_CONFIG.baseURL}/clientes`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        }).catch(() => ({ ok: false, json: async () => [] })),
        fetch(`${API_CONFIG.baseURL}/pedidos`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        }).catch(() => ({ ok: false, json: async () => [] })),
        fetch(`${API_CONFIG.baseURL}/conversaciones`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        }).catch(() => ({ ok: false, json: async () => [] })),
        fetch(`${API_CONFIG.baseURL}/eventos`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        }).catch(() => ({ ok: false, json: async () => [] }))
      ]);

      let clientes: any[] = [];
      let pedidos: any[] = [];
      let conversaciones: any[] = [];
      let eventos: any[] = [];

      if (clientesRes.ok) {
        clientes = await clientesRes.json();
      }

      if (pedidosRes.ok) {
        pedidos = await pedidosRes.json();
      }

      if (conversacionesRes.ok) {
        conversaciones = await conversacionesRes.json();
      }

      if (eventosRes.ok) {
        eventos = await eventosRes.json();
      }

      const newCounts = {
        clientes: Array.isArray(clientes) ? clientes.length : 0,
        pedidos: Array.isArray(pedidos) ? pedidos.length : 0,
        conversaciones: Array.isArray(conversaciones) ? conversaciones.length : 0,
        eventos: Array.isArray(eventos) ? eventos.length : 0
      };

      console.log('📊 Conteos:', { 
        anteriores: lastCounts, 
        nuevos: newCounts,
        isInitial,
        isFirstLoad: isFirstLoad.current
      });

      // Si es la primera carga o recarga inicial, solo guardar conteos sin notificaciones
      if (isInitial || isFirstLoad.current) {
        console.log('✅ Primera carga - guardando conteos sin notificaciones');
        setLastCounts(newCounts);
        isFirstLoad.current = false;
        return;
      }

      // Detectar nuevas actualizaciones solo si hay cambios
      const newNotifications: Notification[] = [];

      if (lastCounts.clientes > 0 && newCounts.clientes > lastCounts.clientes) {
        const diff = newCounts.clientes - lastCounts.clientes;
        console.log('🆕 Nuevos clientes detectados:', diff);
        newNotifications.push({
          id: `clientes-${Date.now()}`,
          type: 'clientes',
          message: `${diff} nuevo${diff > 1 ? 's' : ''} cliente${diff > 1 ? 's' : ''}`,
          timestamp: new Date(),
          read: false
        });
      }

      if (lastCounts.pedidos > 0 && newCounts.pedidos > lastCounts.pedidos) {
        const diff = newCounts.pedidos - lastCounts.pedidos;
        console.log('🆕 Nuevos pedidos detectados:', diff);
        newNotifications.push({
          id: `pedidos-${Date.now()}`,
          type: 'pedidos',
          message: `${diff} nuevo${diff > 1 ? 's' : ''} pedido${diff > 1 ? 's' : ''}`,
          timestamp: new Date(),
          read: false
        });
      }

      if (lastCounts.conversaciones > 0 && newCounts.conversaciones > lastCounts.conversaciones) {
        const diff = newCounts.conversaciones - lastCounts.conversaciones;
        newNotifications.push({
          id: `conversaciones-${Date.now()}`,
          type: 'conversaciones',
          message: `${diff} nueva${diff > 1 ? 's' : ''} conversación${diff > 1 ? 'es' : ''}`,
          timestamp: new Date(),
          read: false
        });
      }

      if (lastCounts.eventos > 0 && newCounts.eventos > lastCounts.eventos) {
        const diff = newCounts.eventos - lastCounts.eventos;
        newNotifications.push({
          id: `eventos-${Date.now()}`,
          type: 'eventos',
          message: `${diff} nuevo${diff > 1 ? 's' : ''} evento${diff > 1 ? 's' : ''}`,
          timestamp: new Date(),
          read: false
        });
      }

      if (newNotifications.length > 0) {
        console.log('🔔 Creando notificaciones:', newNotifications);
        setNotifications(prev => [...newNotifications, ...prev].slice(0, 10)); // Mantener solo las últimas 10
      } else {
        console.log('⚪ No hay nuevas notificaciones');
      }

      setLastCounts(newCounts);
    } catch (error) {
      console.error('❌ Error en checkForUpdates:', error);
      console.error('Error checking for updates:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como leída
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );

    // Navegar al panel correspondiente
    navigate(`/dashboard/${notification.type}`);
    setShowDropdown(false);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
    setShowDropdown(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    const icons = {
      clientes: '👥',
      pedidos: '📦',
      conversaciones: '💬',
      eventos: '📢'
    };
    return icons[type as keyof typeof icons] || '🔔';
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // segundos

    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} días`;
  };

  return (
    <div className="notification-bell-container">
      <button
        className="notification-bell-button"
        onClick={() => setShowDropdown(!showDropdown)}
        title="Notificaciones"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <>
          <div className="notification-overlay" onClick={() => setShowDropdown(false)} />
          <div className="notification-dropdown">
            <div className="notification-header">
              <h4>Notificaciones</h4>
              {notifications.length > 0 && (
                <div className="notification-actions">
                  <button onClick={markAllAsRead} className="mark-read-btn">
                    Marcar todas
                  </button>
                  <button onClick={clearAll} className="clear-all-btn">
                    Limpiar
                  </button>
                </div>
              )}
            </div>

            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="no-notifications">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p>No hay notificaciones nuevas</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">{formatTime(notification.timestamp)}</div>
                    </div>
                    {!notification.read && <div className="notification-dot"></div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
