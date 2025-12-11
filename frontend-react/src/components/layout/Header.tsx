import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { exportService } from '../../services/export.service';
import { HelpButton } from '../HelpButton/HelpButton';
import type { ExportType } from '../../types';
import './Header.css';

export function Header() {
  const { user } = useAuth();
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const handleExport = async (type: ExportType) => {
    try {
      await exportService.exportData(type);
      setIsExportMenuOpen(false);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar datos');
    }
  };

  return (
    <header className="top-header">
      <div className="header-left">
        <svg className="dashboard-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
        </svg>
        <div className="header-title-section">
          <h1 className="page-title">Panel de Control</h1>
          <p className="page-subtitle-header">Sistema de Gestión</p>
        </div>
      </div>
      <div className="header-right">
        <span className="user-greeting">
          Bienvenido, {user?.nombre || 'Usuario'}
        </span>
        
        <div className="export-dropdown">
          <button 
            className="export-btn" 
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
          >
            <svg className="export-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15L12 3M12 15L8 11M12 15L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L2 19C2 20.1046 2.89543 21 4 21L20 21C21.1046 21 22 20.1046 22 19L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Exportar Datos</span>
          </button>
          
          {isExportMenuOpen && (
            <div className="export-menu">
              <div className="export-menu-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Exportar para Power BI
              </div>
              
              <button 
                className="export-menu-item" 
                onClick={() => handleExport('clientes')}
              >
                <svg className="export-menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M23 21V19C23 18.0154 22.6049 17.0902 21.9163 16.4268C21.2277 15.7633 20.3041 15.4189 19.3333 15.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 3.4C16.9704 3.8177 17.8934 4.1621 18.5816 4.8256C19.2697 5.4891 19.6646 6.4142 19.6646 7.4C19.6646 8.3858 19.2697 9.3109 18.5816 9.9744C17.8934 10.6379 16.9704 10.9823 16 11.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="export-menu-text">
                  <div className="export-menu-title">Clientes</div>
                  <div className="export-menu-desc">Lista completa de clientes</div>
                </div>
              </button>

              <button 
                className="export-menu-item" 
                onClick={() => handleExport('pedidos')}
              >
                <svg className="export-menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="export-menu-text">
                  <div className="export-menu-title">Pedidos</div>
                  <div className="export-menu-desc">Histórico de pedidos</div>
                </div>
              </button>

              <button 
                className="export-menu-item" 
                onClick={() => handleExport('conversaciones')}
              >
                <svg className="export-menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="export-menu-text">
                  <div className="export-menu-title">Conversaciones</div>
                  <div className="export-menu-desc">Registro de interacciones</div>
                </div>
              </button>

              <button 
                className="export-menu-item" 
                onClick={() => handleExport('estadisticas')}
              >
                <svg className="export-menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="export-menu-text">
                  <div className="export-menu-title">Estadísticas</div>
                  <div className="export-menu-desc">Métricas generales</div>
                </div>
              </button>

              <button 
                className="export-menu-item" 
                onClick={() => handleExport('eventos')}
              >
                <svg className="export-menu-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="export-menu-text">
                  <div className="export-menu-title">Eventos</div>
                  <div className="export-menu-desc">Log de eventos</div>
                </div>
              </button>
            </div>
          )}
        </div>
        
        <HelpButton />
      </div>
    </header>
  );
}
