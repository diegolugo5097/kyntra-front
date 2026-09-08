import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

export default function ChangePassword() {
  const { refreshUser, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setBusy(true);
    try {
      await api.changePassword(undefined, newPassword);
      await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="theme-toggle-floating">
        <ThemeToggle />
      </div>
      <div className="auth-card">
        <div className="auth-header">
          <img src="/icons/icon-192.png" alt="Kyntra" className="auth-logo" />
          <p className="brand-name">KYNTRA</p>
          <p className="eyebrow">Primer ingreso</p>
          <h1>Elige tu contraseña</h1>
        </div>
        <p className="muted">Tu entrenador te dio una contraseña temporal. Cámbiala antes de continuar.</p>
        <form onSubmit={handleSubmit}>
          <label>
            Nueva contraseña
            <input
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>
          <label>
            Confirmar contraseña
            <input
              type="password"
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar y continuar'}
          </button>
        </form>
        <button className="btn-link" onClick={logout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
