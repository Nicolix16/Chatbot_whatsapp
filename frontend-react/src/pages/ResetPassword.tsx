import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_CONFIG } from '../config/api';
import { MdLock, MdLayers, MdFlashOn, MdShield } from 'react-icons/md';
import './ResetPassword.css';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(true);
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError('Token de recuperación no válido o expirado');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validaciones
    if (!password || !confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_CONFIG.baseURL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Contraseña restablecida exitosamente. Redirigiendo al inicio de sesión...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || 'Error al restablecer la contraseña');
      }
    } catch (err) {
      setError('Error de conexión. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      {/* Panel izquierdo con logo y menú */}
      <div className="reset-password-sidebar">
        <div className="sidebar-logo">
          <img 
            src="/assets/images/Avellano.png" 
            alt="Avellano - Alimentar es amar" 
            onError={(e) => {
              e.currentTarget.outerHTML = '<div style="color: #D1132A; font-size: 2.5rem; font-weight: 900;">Avellano</div>';
            }}
          />
        </div>

        <div className="sidebar-menu">
          <div className="menu-item">
            <div className="menu-item-icon"><MdLock /></div>
            <div className="menu-item-content">
              <div className="menu-item-title">Seguridad</div>
              <div className="menu-item-subtitle">Tu nueva contraseña será encriptada</div>
            </div>
          </div>

          <div className="menu-item">
            <div className="menu-item-icon"><MdLayers /></div>
            <div className="menu-item-content">
              <div className="menu-item-title">Nueva Contraseña</div>
              <div className="menu-item-subtitle">Crea una contraseña segura</div>
            </div>
          </div>

          <div className="menu-item">
            <div className="menu-item-icon"><MdFlashOn /></div>
            <div className="menu-item-content">
              <div className="menu-item-title">Acceso Inmediato</div>
              <div className="menu-item-subtitle">Inicia sesión al terminar</div>
            </div>
          </div>

          <div className="menu-item">
            <div className="menu-item-icon"><MdShield /></div>
            <div className="menu-item-content">
              <div className="menu-item-title">Protección</div>
              <div className="menu-item-subtitle">Token de un solo uso</div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho con formulario */}
      <div className="reset-password-form-panel">
        <div className="reset-password-form-container">
          <div className="reset-password-header">
            <h1>Restablecer Contraseña</h1>
            <p>Ingresa tu nueva contraseña para acceder a tu cuenta</p>
          </div>

          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {tokenValid ? (
            <form className="reset-password-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="password">NUEVA CONTRASEÑA</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu nueva contraseña"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">CONFIRMAR CONTRASEÑA</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirma tu nueva contraseña"
                  disabled={isLoading}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="reset-password-button"
                disabled={isLoading}
              >
                {isLoading ? 'RESTABLECIENDO...' : 'RESTABLECER CONTRASEÑA'}
              </button>

              <div className="reset-password-link">
                <a onClick={() => navigate('/login')}>
                  ← Volver a iniciar Sesión
                </a>
              </div>
            </form>
          ) : (
            <div className="invalid-token">
              <p>El enlace de recuperación no es válido o ha expirado.</p>
              <div className="reset-password-link">
                <a onClick={() => navigate('/forgot-password')}>
                  Solicitar nuevo enlace
                </a>
              </div>
            </div>
          )}

          <div className="reset-password-notice">
            <p className="notice-title">⚠️ Recomendaciones de seguridad:</p>
            <p>• Usa al menos 6 caracteres</p>
            <p>• Combina letras, números y símbolos</p>
            <p>• No uses contraseñas obvias o comunes</p>
            <p className="notice-footer">Este enlace expirará en 1 hora desde que fue generado.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
