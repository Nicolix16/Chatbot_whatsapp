import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../config/api';
import { MdLock, MdMail, MdShield, MdChat } from 'react-icons/md';
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
      const response = await fetch(`${API_CONFIG.baseURL}/auth/forgot-password`, {
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
      {/* Panel izquierdo */}
      <div className="forgot-password-sidebar">
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <div className="sidebar-logo">
            <img 
              src="/assets/images/LOGO_AVELLANO.png" 
              alt="Logo Avellano"
            />
          </div>
        </div>

        <div className="sidebar-menu">
          <div className="menu-item">
            <div className="menu-item-icon"><MdLock /></div>
            <div className="menu-item-content">
              <div className="menu-item-title">Seguridad</div>
              <div className="menu-item-subtitle">Tu información está protegida</div>
            </div>
          </div>

          <div className="menu-item">
            <div className="menu-item-icon"><MdMail /></div>
            <div className="menu-item-content">
              <div className="menu-item-title">Rápido</div>
              <div className="menu-item-subtitle">Recupera tu acceso en minutos</div>
            </div>
          </div>

          <div className="menu-item">
            <div className="menu-item-icon"><MdShield /></div>
            <div className="menu-item-content">
              <div className="menu-item-title">Confiable</div>
              <div className="menu-item-subtitle">Proceso seguro y encriptado</div>
            </div>
          </div>

          <div className="menu-item">
            <div className="menu-item-icon"><MdChat /></div>
            <div className="menu-item-content">
              <div className="menu-item-title">Comunicaciones</div>
              <div className="menu-item-subtitle">Gestión de WhatsApp</div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho con formulario */}
      <div className="forgot-password-form-panel">
        <div className="forgot-password-form-container">
          <div className="forgot-password-header">
            <h1>Recuperación de Contraseña</h1>
            <p>Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña</p>
          </div>

          <form onSubmit={handleSubmit} className="forgot-password-form">
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
              className="forgot-password-button"
              disabled={isLoading}
            >
              {isLoading ? 'ENVIANDO...' : 'ENVIAR ENLACE DE RECUPERACIÓN'}
            </button>

            <div className="forgot-password-link">
              <a onClick={() => navigate('/login')}>
                ← Volver a iniciar Sesión
              </a>
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
