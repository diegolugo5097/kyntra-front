import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { playNotificationSound } from '../utils/sound.js';
import { Bell } from 'lucide-react';

export default function Notifications({ liveEvent, refreshKey }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const loadedOnce = useRef(false);

  function load() {
    api.getNotifications().then((list) => {
      setItems(list);
      loadedOnce.current = true;
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useEffect(() => {
    if (liveEvent?.event !== 'notification') return;
    setItems((prev) => [liveEvent.data, ...prev]);
    // Solo suena para notificaciones que llegan en vivo, no para la carga inicial del historial.
    if (loadedOnce.current) playNotificationSound();
  }, [liveEvent]);

  const unread = items.filter((n) => !n.is_read).length;

  async function markAll() {
    await api.markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  return (
    <div className="notif-wrap">
      <button className="icon-btn" onClick={() => setOpen((o) => !o)}>
        <Bell size={19} />
        {unread > 0 && <span className="notif-badge">{unread}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-panel-head">
            <span>Notificaciones</span>
            {unread > 0 && (
              <button className="btn-link" onClick={markAll}>
                Marcar todas como leídas
              </button>
            )}
          </div>
          {items.length === 0 && <p className="muted notif-empty">Sin notificaciones.</p>}
          {items.map((n) => (
            <div key={n.id} className={`notif-item ${n.is_read ? '' : 'unread'}`}>
              <p>{n.message}</p>
              <span className="notif-time">{new Date(n.created_at).toLocaleString('es-CO')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
