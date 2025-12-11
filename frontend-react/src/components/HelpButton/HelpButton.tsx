import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
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
            <h4>📚 Tutoriales</h4>
          </div>
          
          <div className="help-menu-items">
            <button
              className="help-menu-item highlight"
              onClick={getContextualTutorial()}
            >
              <span className="help-icon">⚡</span>
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
              <span className="help-icon">🎯</span>
              <div>
                <div className="help-title">Tour Completo</div>
                <div className="help-desc">Recorrido por todo el dashboard</div>
              </div>
            </button>

            <button
              className="help-menu-item"
              onClick={() => handleTutorial('clientes')}
            >
              <span className="help-icon">👥</span>
              <div>
                <div className="help-title">Gestión de Clientes</div>
                <div className="help-desc">Cómo administrar clientes</div>
              </div>
            </button>

            <button
              className="help-menu-item"
              onClick={() => handleTutorial('pedidos')}
            >
              <span className="help-icon">📦</span>
              <div>
                <div className="help-title">Gestión de Pedidos</div>
                <div className="help-desc">Crear y administrar pedidos</div>
              </div>
            </button>

            <button
              className="help-menu-item"
              onClick={() => handleTutorial('conversaciones')}
            >
              <span className="help-icon">💬</span>
              <div>
                <div className="help-title">Conversaciones</div>
                <div className="help-desc">Historial de WhatsApp</div>
              </div>
            </button>

            <button
              className="help-menu-item"
              onClick={() => handleTutorial('eventos')}
            >
              <span className="help-icon">📅</span>
              <div>
                <div className="help-title">Eventos</div>
                <div className="help-desc">Calendario y programación</div>
              </div>
            </button>

            {canAccessUsuarios && (
              <button
                className="help-menu-item"
                onClick={() => handleTutorial('usuarios')}
              >
                <span className="help-icon">⚙️</span>
                <div>
                  <div className="help-title">Gestión de Usuarios</div>
                  <div className="help-desc">Administrar usuarios y roles</div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
