import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import './ForgotPassword.css';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Se ha enviado un enlace de recuperación a tu correo electrónico. Por favor revisa tu bandeja de entrada.');
        setEmail('');
      } else {
        setError(data.error || 'Error al enviar el enlace de recuperación');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error de conexión. Por favor intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-left">
        <div className="brand-section">
          <img src="/logo.png" alt="Avellano" className="brand-logo" />
          <h1 className="brand-name">Avellano</h1>
        </div>
        
        <div className="info-cards">
          <div className="info-card">
            <div className="info-icon">🔐</div>
            <h3>Seguridad</h3>
            <p>Tu información está protegida</p>
          </div>
          <div className="info-card">
            <div className="info-icon">📧</div>
            <h3>Rápido</h3>
            <p>Recupera tu acceso en minutos</p>
          </div>
          <div className="info-card">
            <div className="info-icon">🔒</div>
            <h3>Confiable</h3>
            <p>Proceso seguro y encriptado</p>
          </div>
          <div className="info-card">
            <div className="info-icon">💬</div>
            <h3>Comunicaciones</h3>
            <p>Gestión de WhatsApp</p>
          </div>
        </div>
      </div>

      <div className="forgot-password-right">
        <div className="forgot-password-card">
          <div className="avellano-header">
            <img src="/logo.png" alt="Avellano" className="header-logo" />
            <h2>Avellano</h2>
          </div>

          <h1 className="forgot-title">Recuperación de Contraseña</h1>
          <p className="forgot-subtitle">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
          </p>

          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="forgot-form">
            <div className="form-group">
              <label htmlFor="email">CORREO ELECTRÓNICO</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@avellano.com"
                disabled={isLoading}
                required
              />
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'ENVIANDO...' : 'ENVIAR ENLACE DE RECUPERACIÓN'}
            </button>

            <div className="back-to-login">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="back-link"
              >
                ← Volver a iniciar Sesión
              </button>
            </div>
          </form>

          <div className="security-note">
            <p>⚠️ <strong>Importante:</strong> Este enlace expirará en 1 hora por motivos de seguridad</p>
            <p className="small-text">Si no realizó este cambio, puede ignorar este mensaje y su contraseña permanecerá igual.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
