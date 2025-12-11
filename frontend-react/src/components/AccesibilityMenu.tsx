import { useState, useEffect } from 'react';
import './AccesibilityMenu.css';

interface AccesibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  lineSpacing: 'normal' | 'wide';
  highContrast: boolean;
  underlineLinks: boolean;
  grayscale: boolean;
  legibleFont: boolean;
}

const defaultSettings: AccesibilitySettings = {
  fontSize: 'medium',
  lineSpacing: 'normal',
  highContrast: false,
  underlineLinks: false,
  grayscale: false,
  legibleFont: false,
};

export function AccesibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccesibilitySettings>(defaultSettings);

  // Cargar configuración desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('accesibilitySettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Error cargando configuración de accesibilidad:', e);
      }
    }
  }, []);

  // Aplicar configuración al DOM
  useEffect(() => {
    const root = document.documentElement;
    
    // Tamaño de texto
    root.setAttribute('data-font-size', settings.fontSize);
    
    // Espaciado de líneas
    root.setAttribute('data-line-spacing', settings.lineSpacing);
    
    // Alto contraste
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Subrayar enlaces
    if (settings.underlineLinks) {
      root.classList.add('underline-links');
    } else {
      root.classList.remove('underline-links');
    }
    
    // Escala de grises
    if (settings.grayscale) {
      root.classList.add('grayscale');
    } else {
      root.classList.remove('grayscale');
    }
    
    // Fuente legible
    if (settings.legibleFont) {
      root.classList.add('legible-font');
    } else {
      root.classList.remove('legible-font');
    }
    
    // Guardar en localStorage
    localStorage.setItem('accesibilitySettings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof AccesibilitySettings>(
    key: K,
    value: AccesibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('accesibilitySettings');
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        className="accesibility-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Opciones de accesibilidad"
        title="Opciones de accesibilidad"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="6" r="2" fill="currentColor"/>
          <path d="M15.5 8.5L18 21L15.5 20.5L12 11L8.5 20.5L6 21L8.5 8.5" fill="currentColor"/>
          <path d="M8 8.5H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Panel de opciones */}
      {isOpen && (
        <>
          <div className="accesibility-overlay" onClick={() => setIsOpen(false)} />
          <div className="accesibility-panel">
            <div className="accesibility-header">
              <h3>Opciones de Accesibilidad</h3>
              <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
            </div>

            <div className="accesibility-content">
              {/* Tamaño de Texto */}
              <div className="accesibility-section">
                <label className="section-label">Tamaño de Texto</label>
                <div className="button-group">
                  <button
                    className={`size-btn ${settings.fontSize === 'small' ? 'active' : ''}`}
                    onClick={() => updateSetting('fontSize', 'small')}
                  >
                    <span style={{ fontSize: '12px' }}>A</span>
                  </button>
                  <button
                    className={`size-btn ${settings.fontSize === 'medium' ? 'active' : ''}`}
                    onClick={() => updateSetting('fontSize', 'medium')}
                  >
                    <span style={{ fontSize: '14px' }}>A</span>
                  </button>
                  <button
                    className={`size-btn ${settings.fontSize === 'large' ? 'active' : ''}`}
                    onClick={() => updateSetting('fontSize', 'large')}
                  >
                    <span style={{ fontSize: '16px' }}>A</span>
                  </button>
                  <button
                    className={`size-btn ${settings.fontSize === 'xlarge' ? 'active' : ''}`}
                    onClick={() => updateSetting('fontSize', 'xlarge')}
                  >
                    <span style={{ fontSize: '18px' }}>A</span>
                  </button>
                </div>
              </div>

              {/* Espaciado de Líneas */}
              <div className="accesibility-section">
                <label className="section-label">Espaciado de Líneas</label>
                <div className="button-group">
                  <button
                    className={`spacing-btn ${settings.lineSpacing === 'normal' ? 'active' : ''}`}
                    onClick={() => updateSetting('lineSpacing', 'normal')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2"/>
                      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2"/>
                      <line x1="4" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                  <button
                    className={`spacing-btn ${settings.lineSpacing === 'wide' ? 'active' : ''}`}
                    onClick={() => updateSetting('lineSpacing', 'wide')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <line x1="4" y1="4" x2="20" y2="4" stroke="currentColor" strokeWidth="2"/>
                      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2"/>
                      <line x1="4" y1="20" x2="20" y2="20" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="accesibility-section">
                <div className="toggle-item">
                  <div className="toggle-label">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 12 22" fill="currentColor"/>
                    </svg>
                    Alto Contraste
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.highContrast}
                      onChange={(e) => updateSetting('highContrast', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-label">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M4 12H20" stroke="currentColor" strokeWidth="2"/>
                      <path d="M4 16H20" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2"/>
                    </svg>
                    Subrayar Enlaces
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.underlineLinks}
                      onChange={(e) => updateSetting('underlineLinks', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-label">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="3" fill="currentColor"/>
                    </svg>
                    Escala de Grises
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.grayscale}
                      onChange={(e) => updateSetting('grayscale', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="toggle-item">
                  <div className="toggle-label">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M4 7V17M8 5V19M12 3V21M16 5V19M20 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Fuente Legible
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.legibleFont}
                      onChange={(e) => updateSetting('legibleFont', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              {/* Botón de resetear */}
              <button className="reset-btn" onClick={resetSettings}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C9.60771 20 7.47058 18.8771 6.08296 17.1221" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M4 8V12H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Restablecer Configuración
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
