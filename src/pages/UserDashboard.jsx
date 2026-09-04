import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useWebSocket } from '../hooks/useWebSocket.js';
import Notifications from '../components/Notifications.jsx';
import RoutineView from '../components/RoutineView.jsx';
import Chat from '../components/Chat.jsx';
import { RefreshCw } from 'lucide-react';

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('routine');
  const [liveEvent, setLiveEvent] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useWebSocket(true, setLiveEvent);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-title-group">
          <img src="/icons/icon-192.png" alt="Kyntra" className="header-logo" />
          <div>
            <p className="brand-name-sm">KYNTRA</p>
            <p className="eyebrow">Tu progreso</p>
            <h1>{user.name}</h1>
          </div>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => setRefreshKey((k) => k + 1)} title="Refrescar">
            <RefreshCw size={19} />
          </button>
          <Notifications liveEvent={liveEvent} refreshKey={refreshKey} />
          <button className="btn-link" onClick={logout}>Salir</button>
        </div>
      </header>

      <div className="dashboard-body single-col">
        <main className="main-panel">
          <div className="tabs">
            <button className={tab === 'routine' ? 'active' : ''} onClick={() => setTab('routine')}>
              Rutina
            </button>
            <button className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>
              Chat con tu entrenador
            </button>
          </div>

          {tab === 'routine' && <RoutineView liveEvent={liveEvent} refreshKey={refreshKey} />}
          {tab === 'chat' && (
            <Chat otherUserId={user.trainer_id} otherUserName="Tu entrenador" liveEvent={liveEvent} refreshKey={refreshKey} />
          )}
        </main>
      </div>
    </div>
  );
}
