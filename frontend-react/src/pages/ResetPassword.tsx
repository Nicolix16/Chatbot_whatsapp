import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config/api';
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
      const response = await fetch(`${API_URL}/auth/reset-password`, {
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
      {/* Left Panel */}
      <div className="reset-password-left">
        <div className="brand-section">
          <img 
            src="/assets/logo.png" 
            alt="Avellano" 
            className="brand-logo"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="brand-name">Avellano</h1>
        </div>

        <div className="info-cards">
          <div className="info-card">
            <div className="info-icon">🔒</div>
            <div>
              <h3>Seguridad</h3>
              <p>Tu nueva contraseña será encriptada</p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">✨</div>
            <div>
              <h3>Nueva Contraseña</h3>
              <p>Crea una contraseña segura</p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">⚡</div>
            <div>
              <h3>Acceso Inmediato</h3>
              <p>Inicia sesión al terminar</p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">🛡️</div>
            <div>
              <h3>Protección</h3>
              <p>Token de un solo uso</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="reset-password-right">
        <div className="reset-password-card">
          <h1 className="reset-title">Restablecer Contraseña</h1>
          <p className="reset-subtitle">
            Ingresa tu nueva contraseña para acceder a tu cuenta
          </p>

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
            <form className="reset-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="password">Nueva Contraseña</label>
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
                <label htmlFor="confirmPassword">Confirmar Contraseña</label>
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
                className="submit-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Restableciendo...' : 'RESTABLECER CONTRASEÑA'}
              </button>

              <div className="back-to-login">
                <button
                  type="button"
                  className="back-link"
                  onClick={() => navigate('/login')}
                >
                  Volver a iniciar Sesión
                </button>
              </div>
            </form>
          ) : (
            <div className="invalid-token">
              <p>El enlace de recuperación no es válido o ha expirado.</p>
              <button
                className="back-link"
                onClick={() => navigate('/forgot-password')}
              >
                Solicitar nuevo enlace
              </button>
            </div>
          )}

          <div className="security-note">
            <p><strong>⚠️ Recomendaciones de seguridad:</strong></p>
            <p>• Usa al menos 6 caracteres</p>
            <p>• Combina letras, números y símbolos</p>
            <p>• No uses contraseñas obvias o comunes</p>
            <p className="small-text">Este enlace expirará en 1 hora desde que fue generado.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
