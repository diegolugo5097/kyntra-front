import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
function addUnique(list, msg) {
  if (list.some((m) => m.id === msg.id)) return list;
  return [...list, msg];
}

export default function Chat({ otherUserId, otherUserName, liveEvent, refreshKey }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!otherUserId) return;
    api.getChatHistory(otherUserId).then(setMessages);
  }, [otherUserId, refreshKey]);

  useEffect(() => {
    if (liveEvent?.event !== 'message') return;
    const m = liveEvent.data;
    const belongsHere =
      (m.sender_id === otherUserId && m.receiver_id === user.id) ||
      (m.sender_id === user.id && m.receiver_id === otherUserId);
    if (!belongsHere) return;

    // El backend emite este evento tanto al receptor como (en eco) al propio remitente,
    // así que evitamos duplicados por id en vez de siempre agregar.
    setMessages((prev) => addUnique(prev, m));
    // El sonido de aviso se reproduce una sola vez desde el componente de Notificaciones,
    // que recibe un evento por cada mensaje nuevo (evita que suene doble).
  }, [liveEvent, otherUserId, user.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim()) return;
    const content = text;
    setText('');
    const msg = await api.sendMessage(otherUserId, content);
    // Se agrega aquí para que se sienta instantáneo; si el eco por WebSocket llega
    // después, addUnique evita que se duplique.
    setMessages((prev) => addUnique(prev, msg));
  }

  if (!otherUserId) return <p className="muted">Selecciona un usuario para chatear.</p>;

  return (
    <div className="chat-box">
      <div className="chat-head">{otherUserName}</div>
      <div className="chat-messages">
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble ${m.sender_id === user.id ? 'mine' : 'theirs'}`}>
            <p>{m.content}</p>
            <span>{new Date(m.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form className="chat-input-row" onSubmit={handleSend}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje…"
        />
        <button className="btn-primary" type="submit">
          Enviar
        </button>
      </form>
    </div>
  );
}
