import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/icons/icon-192.png" alt="Kyntra" className="auth-logo" />
          <p className="brand-name">KYNTRA</p>
          <p className="eyebrow">Bitácora de entrenamiento</p>
          <h1>Iniciar sesión</h1>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            Correo
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <button className="btn-link forgot-link" onClick={() => setShowForgot((s) => !s)}>
          ¿Olvidaste tu contraseña?
        </button>
        {showForgot && (
          <p className="muted forgot-text">
            Aquí no hay recuperación por correo: si eres alumno, pídele a tu entrenador que te
            restablezca la contraseña desde su panel. Si eres el entrenador, pide a quien administre
            el servidor que corra el script <code>resetPassword.js</code>.
          </p>
        )}
      </div>
    </div>
  );
}
