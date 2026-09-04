// Genera un pequeño "ping" con la Web Audio API (sin necesidad de un archivo .mp3).
// El navegador exige que el AudioContext se cree/reanude tras una interacción del usuario
// (por ejemplo, el clic en "Entrar"), así que lo creamos perezosamente en el primer uso.

let ctx = null;

function getContext() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function playNotificationSound() {
  const audioCtx = getContext();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const gain = audioCtx.createGain();
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

  // Dos tonos cortos (un "ping-pong" ascendente), estilo aviso de chat
  [880, 1175].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    const start = now + i * 0.09;
    osc.start(start);
    osc.stop(start + 0.18);
  });
}
