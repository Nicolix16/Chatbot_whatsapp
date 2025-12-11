import { useState, useEffect } from 'react';
import { exportService } from '../services/export.service';
import type { ExportType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import './ExportMenu.css';

export function ExportMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedType, setSelectedType] = useState<ExportType | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    console.log('ExportMenu montado correctamente');
  }, []);

  useEffect(() => {
    console.log('isOpen cambió a:', isOpen);
  }, [isOpen]);

  const handleSelectType = (type: ExportType) => {
    setSelectedType(type);
  };

  const handleExport = async () => {
    if (!selectedType) return;

    setIsExporting(true);
    try {
      await exportService.exportData(selectedType, 'powerbi');
      alert(`Datos de ${selectedType} exportados exitosamente en formato JSON`);
      setIsOpen(false);
      setSelectedType(null);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar los datos');
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions: { type: ExportType; label: string; icon: string }[] = [
    { type: 'clientes', label: 'Clientes', icon: '' },
    { type: 'pedidos', label: 'Pedidos', icon: '' },
    { type: 'conversaciones', label: 'Conversaciones', icon: '' },
  ];

  // Agregar Usuarios solo si es administrador
  if (user?.rol === 'administrador') {
    exportOptions.push({ type: 'usuarios', label: 'Usuarios', icon: '' });
  }

  return (
    <div className="export-menu-container">
      <button
        className={`export-btn ${isOpen ? 'active' : ''}`}
        onClick={() => {
          console.log('Botón clickeado, isOpen:', !isOpen);
          setIsOpen(!isOpen);
        }}
        title="Exportar Datos"
        disabled={isExporting}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Exportar Datos
      </button>

      {isOpen && (
        <>
          <div className="export-overlay" onClick={() => setIsOpen(false)} />
          <div className="export-dropdown">
            <div className="export-dropdown-header">
              <span>{selectedType ? `Exportar ${selectedType}` : 'Selecciona qué exportar'}</span>
              <button className="close-dropdown" onClick={() => setIsOpen(false)}>×</button>
            </div>

            {!selectedType ? (
              <div className="export-options">
                {exportOptions.map(option => (
                  <button
                    key={option.type}
                    className="export-type-btn"
                    onClick={() => handleSelectType(option.type)}
                    disabled={isExporting}
                  >
                    <span className="export-icon">{option.icon}</span>
                    <span className="export-label">{option.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="export-options">
                <button
                  className="export-option"
                  onClick={() => handleExport()}
                  disabled={isExporting}
                >
                  <span className="export-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#F2C811" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="#F2C811" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 18V12M9 15L12 12L15 15" stroke="#F2C811" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <div className="export-option-text">
                    <div className="export-label">Descargar JSON</div>
                    <div className="export-desc">Archivo .json para Power BI</div>
                  </div>
                </button>

                <button
                  className="back-btn"
                  onClick={() => setSelectedType(null)}
                >
                  ← Volver
                </button>
              </div>
            )}

            <div className="export-footer">
              <small>{isExporting ? 'Exportando...' : selectedType ? 'Haz clic para descargar' : 'Selecciona qué datos exportar'}</small>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
