import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  startCompleteTutorial,
  startClientesTutorial,
  startPedidosTutorial,
  startConversacionesTutorial,
  startEventosTutorial,
  startUsuariosTutorial
} from '../../utils/tutorials';
import './HelpButton.css';

export function HelpButton() {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTutorial = (tutorialType: string) => {
    setShowMenu(false);
    
    // Determinar página actual
    const currentPage = location.pathname.split('/').pop();
    
    // Mapeo de tutoriales a páginas
    const tutorialPages: Record<string, string> = {
      'clientes': 'clientes',
      'pedidos': 'pedidos',
      'conversaciones': 'conversaciones',
      'eventos': 'eventos',
      'usuarios': 'usuarios'
    };
    
    // Si el tutorial no es 'complete' y no estamos en la página correcta, redirigir
    if (tutorialType !== 'complete' && tutorialPages[tutorialType] && currentPage !== tutorialPages[tutorialType]) {
      navigate(`/dashboard/${tutorialPages[tutorialType]}`);
      // Esperar a que se cargue la página antes de iniciar tutorial
      setTimeout(() => {
        startTutorial(tutorialType);
      }, 500);
    } else {
      startTutorial(tutorialType);
    }
  };

  const startTutorial = (tutorialType: string) => {
    switch (tutorialType) {
      case 'complete':
        startCompleteTutorial(user?.rol || 'operador');
        break;
      case 'clientes':
        startClientesTutorial();
        break;
      case 'pedidos':
        startPedidosTutorial();
        break;
      case 'conversaciones':
        startConversacionesTutorial();
        break;
      case 'eventos':
        startEventosTutorial();
        break;
      case 'usuarios':
        startUsuariosTutorial();
        break;
    }
  };

  // Determinar qué página estamos viendo
  const currentPage = location.pathname.split('/').pop();

  // Tutorial contextual según la página actual
  const getContextualTutorial = () => {
    switch (currentPage) {
      case 'clientes':
        return () => handleTutorial('clientes');
      case 'pedidos':
        return () => handleTutorial('pedidos');
      case 'conversaciones':
        return () => handleTutorial('conversaciones');
      case 'eventos':
        return () => handleTutorial('eventos');
      case 'usuarios':
        return () => handleTutorial('usuarios');
      default:
        return () => handleTutorial('complete');
    }
  };

  const canAccessUsuarios = user?.rol === 'administrador' || user?.rol === 'soporte';

  return (
    <div className="help-button-container" ref={menuRef}>
      <button
        className="help-button"
        onClick={() => setShowMenu(!showMenu)}
        title="Ayuda y Tutoriales"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="8" r="1" fill="currentColor"/>
        </svg>
      </button>

      {showMenu && (
        <div className="help-menu">
          <div className="help-menu-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h4>Tutoriales</h4>
          </div>
          
          <div className="help-menu-items">
            <button
              className="help-menu-item highlight"
              onClick={getContextualTutorial()}
            >
              <svg className="help-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <div className="help-title">Tutorial de esta página</div>
                <div className="help-desc">Guía rápida de la sección actual</div>
              </div>
            </button>

            <div className="help-divider"></div>

            <button
              className="help-menu-item"
              onClick={() => handleTutorial('complete')}
            >
              <svg className="help-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div>
                <div className="help-title">Tour Completo</div>
                <div className="help-desc">Recorrido por todo el dashboard</div>
              </div>
            </button>

            <button
              className="help-menu-item"
              onClick={() => handleTutorial('clientes')}
            >
              <svg className="help-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <div className="help-title">Gestión de Clientes</div>
                <div className="help-desc">Consultar y administrar clientes</div>
              </div>
            </button>

            <button
              className="help-menu-item"
              onClick={() => handleTutorial('pedidos')}
            >
              <svg className="help-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 16V8C20.9996 7.64927 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64927 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.27 6.96L12 12.01L20.73 6.96M12 22.08V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <div className="help-title">Gestión de Pedidos</div>
                <div className="help-desc">Consultar y filtrar pedidos</div>
              </div>
            </button>

            <button
              className="help-menu-item"
              onClick={() => handleTutorial('conversaciones')}
            >
              <svg className="help-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <div className="help-title">Conversaciones</div>
                <div className="help-desc">Historial de WhatsApp</div>
              </div>
            </button>

            {canAccessUsuarios && (
              <>
                <button
                  className="help-menu-item"
                  onClick={() => handleTutorial('eventos')}
                >
                  <svg className="help-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <div>
                    <div className="help-title">Eventos</div>
                    <div className="help-desc">Mensajería masiva programada</div>
                  </div>
                </button>

                <button
                  className="help-menu-item"
                  onClick={() => handleTutorial('usuarios')}
                >
                  <svg className="help-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <div>
                    <div className="help-title">Gestión de Usuarios</div>
                    <div className="help-desc">Administrar usuarios y roles</div>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
