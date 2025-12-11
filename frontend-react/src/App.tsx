import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AccesibilityMenu } from './components/AccesibilityMenu';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Clientes } from './pages/dashboard/Clientes';
import { Pedidos } from './pages/dashboard/Pedidos';
import { Conversaciones } from './pages/dashboard/Conversaciones';
import { Eventos } from './pages/dashboard/Eventos';
import { Usuarios } from './pages/dashboard/Usuarios';
import './App.css';

// Componente para redirección inicial
function RootRedirect() {
  const token = localStorage.getItem('access_token');
  
  // Si hay token, ir al dashboard
  // Si no hay token, ir al login
  return <Navigate to={token ? "/dashboard" : "/login"} replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AccesibilityMenu />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard/clientes" replace />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="pedidos" element={<Pedidos />} />
              <Route path="conversaciones" element={<Conversaciones />} />
              <Route path="eventos" element={<Eventos />} />
              <Route path="usuarios" element={<Usuarios />} />
            </Route>
          </Route>

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
