import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useWebSocket } from '../hooks/useWebSocket.js';
import Notifications from '../components/Notifications.jsx';
import RoutineEditor from '../components/RoutineEditor.jsx';
import Chat from '../components/Chat.jsx';
import { RefreshCw } from 'lucide-react';

export default function TrainerDashboard() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('routine'); // 'routine' | 'chat'
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '' });
  const [createdCreds, setCreatedCreds] = useState(null);
  const [liveEvent, setLiveEvent] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useWebSocket(true, setLiveEvent);

  function refreshAll() {
    loadUsers();
    setRefreshKey((k) => k + 1);
  }

  function loadUsers() {
    api.listUsers().then((list) => {
      setUsers(list);
      if (!selected && list.length) setSelected(list[0]);
    });
  }

  useEffect(loadUsers, []);

  async function handleCreateUser(e) {
    e.preventDefault();
    const { user: created, temp_password } = await api.createUser(newUser.name, newUser.email);
    setCreatedCreds({ ...created, temp_password });
    setNewUser({ name: '', email: '' });
    loadUsers();
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-title-group">
          <img src="/icons/icon-192.png" alt="Kyntra" className="header-logo" />
          <div>
            <p className="brand-name-sm">KYNTRA</p>
            <p className="eyebrow">Panel del entrenador</p>
            <h1>{user.name}</h1>
          </div>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={refreshAll} title="Refrescar">
            <RefreshCw size={19} />
          </button>
          <Notifications liveEvent={liveEvent} refreshKey={refreshKey} />
          <button className="btn-link" onClick={logout}>Salir</button>
        </div>
      </header>

      <div className="dashboard-body">
        <aside className="sidebar">
          <div className="sidebar-head">
            <span>Usuarios</span>
            <button className="btn-link" onClick={() => setShowNewUser((s) => !s)}>
              {showNewUser ? 'Cancelar' : '+ Nuevo'}
            </button>
          </div>

          {showNewUser && (
            <form className="new-user-form" onSubmit={handleCreateUser}>
              <input
                placeholder="Nombre"
                value={newUser.name}
                onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))}
                required
              />
              <button className="btn-primary" type="submit">Crear cuenta</button>
            </form>
          )}

          {createdCreds && (
            <div className="creds-box">
              <p>Cuenta creada para <strong>{createdCreds.name}</strong>. Entrégale estas credenciales:</p>
              <p>Email: <code>{createdCreds.email}</code></p>
              <p>Contraseña temporal: <code>{createdCreds.temp_password}</code></p>
              <button className="btn-link" onClick={() => setCreatedCreds(null)}>Cerrar</button>
            </div>
          )}

          <ul className="user-list">
            {users.map((u) => (
              <li
                key={u.id}
                className={selected?.id === u.id ? 'active' : ''}
                onClick={() => setSelected(u)}
              >
                {u.name}
                {u.must_change_password && <span className="pill">Sin activar</span>}
              </li>
            ))}
          </ul>
        </aside>

        <main className="main-panel">
          <div className="tabs">
            <button className={tab === 'routine' ? 'active' : ''} onClick={() => setTab('routine')}>
              Rutina
            </button>
            <button className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>
              Chat
            </button>
          </div>

          {tab === 'routine' && <RoutineEditor selectedUser={selected} liveEvent={liveEvent} refreshKey={refreshKey} />}
          {tab === 'chat' && (
            <Chat otherUserId={selected?.id} otherUserName={selected?.name} liveEvent={liveEvent} refreshKey={refreshKey} />
          )}
        </main>
      </div>
    </div>
  );
}
