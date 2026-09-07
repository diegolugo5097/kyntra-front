import { api } from '../api.js';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUBLIC_KEY;
}

export async function getPushSubscriptionState() {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  return sub ? 'subscribed' : 'not-subscribed';
}

export async function subscribeToPush() {
  if (!isPushSupported()) throw new Error('Este navegador no soporta notificaciones push');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Permiso de notificaciones no concedido');

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }
  await api.subscribePush(sub.toJSON());
  return sub;
}

export async function unsubscribeFromPush() {
  if (!isPushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await api.unsubscribePush({ endpoint: sub.endpoint });
  await sub.unsubscribe();
}
