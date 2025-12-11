import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API_CONFIG } from '../../config/api';
import './NotificationBell.css';

interface Notification {
  _id: string;
  tipo: 'nuevo_pedido' | 'usuario_desactivado' | 'usuario_eliminado';
  mensaje: string;
  referencia?: {
    tipo: 'pedido' | 'usuario';
    id: string;
  };
  leida: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Cargar notificaciones del backend
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      console.log('🔔 Consultando notificaciones...');

      const response = await fetch(`${API_CONFIG.baseURL}/notificaciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📬 Respuesta de notificaciones:', data);
        
        if (data.success && Array.isArray(data.data)) {
          setNotifications(data.data);
          console.log(`✅ ${data.data.length} notificaciones cargadas, ${data.data.filter((n: any) => !n.leida).length} no leídas`);
        }
      } else {
        console.error('❌ Error en respuesta:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error cargando notificaciones:', error);
    }
  };

  useEffect(() => {
    // Cargar notificaciones inicialmente
    fetchNotifications();
    
    // Verificar notificaciones cada 10 segundos
    const interval = setInterval(fetchNotifications, 10000);
    
    return () => clearInterval(interval);
  }, [user]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      const token = localStorage.getItem('token');
      
      // Marcar como leída en el backend
      await fetch(`${API_CONFIG.baseURL}/notificaciones/${notification._id}/leer`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Actualizar localmente
      setNotifications(prev =>
        prev.map(n => n._id === notification._id ? { ...n, leida: true } : n)
      );

      // Navegar según el tipo de notificación
      if (notification.tipo === 'nuevo_pedido') {
        navigate('/dashboard/pedidos');
      } else if (notification.tipo === 'usuario_desactivado' || notification.tipo === 'usuario_eliminado') {
        navigate('/dashboard/usuarios');
      }
      
      setShowDropdown(false);
    } catch (error) {
      console.error('Error marcando notificación:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      
      await fetch(`${API_CONFIG.baseURL}/notificaciones/leer-todas`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Actualizar localmente
      setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.leida).length;

  const getNotificationIcon = (tipo: string) => {
    const icons = {
      nuevo_pedido: '📦',
      usuario_desactivado: '⚠️',
      usuario_eliminado: '🗑️'
    };
    return icons[tipo as keyof typeof icons] || '🔔';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
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
                    key={notification._id}
                    className={`notification-item ${notification.leida ? 'read' : 'unread'}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.tipo)}
                    </div>
                    <div className="notification-content">
                      <div className="notification-message">{notification.mensaje}</div>
                      <div className="notification-time">{formatTime(notification.createdAt)}</div>
                    </div>
                    {!notification.leida && <div className="notification-dot"></div>}
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
