import axios from 'axios';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const subscribeToPush = async (token: string) => {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Get public VAPID key from server
    const { data: { publicKey } } = await axios.get('/api/public/vapid-key');
    
    if (!publicKey) {
      console.warn('Push notification public key not found');
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    await axios.post('/api/push/subscribe', { subscription }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Push subscription successful');
  } catch (error) {
    console.error('Failed to subscribe to push notifications', error);
  }
};
