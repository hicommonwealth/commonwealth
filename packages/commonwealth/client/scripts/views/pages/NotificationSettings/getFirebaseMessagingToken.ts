import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

// NOTE that this CAN be public and served to clients. All this data is public
// and designed by Firebase to be public. It's not a secret.
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyA93Av0xLkOB_nP9hyzhGYg78n9JEfS1bQ',
  authDomain: 'common-staging-384806.firebaseapp.com',
  projectId: 'common-staging-384806',
  storageBucket: 'common-staging-384806.appspot.com',
  messagingSenderId: '158803639844',
  appId: '1:158803639844:web:b212938a52d995c6d862b1',
  measurementId: 'G-4PNZZQDNFE',
};

const PUBLIC_VAPID_KEY = process.env.KNOCK_PUSH_NOTIFICATIONS_PUBLIC_VAPID_KEY;

const PUBLIC_FIREBASE_CONFIG = process.env
  .KNOCK_PUSH_NOTIFICATIONS_PUBLIC_FIREBASE_CONFIG
  ? JSON.parse(process.env.KNOCK_PUSH_NOTIFICATIONS_PUBLIC_FIREBASE_CONFIG)
  : DEFAULT_FIREBASE_CONFIG;

// Initialize Firebase
const app = initializeApp(PUBLIC_FIREBASE_CONFIG);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = getMessaging(app);

if (navigator.serviceWorker) {
  console.log('Registering message listener for service worker.');
  navigator.serviceWorker.onmessage = (event) => {
    if (event.data.type === 'log') {
      console.log('Service Worker:', event.data.message);
    } else {
      console.warn('Ignoring message: ', event);
    }
  };
} else {
  console.log('No service worker');
}

export async function getFirebaseMessagingToken() {
  const reg = await navigator.serviceWorker.register(
    '/firebase-messaging-sw.js',
  );
  await navigator.serviceWorker.ready;
  return await getToken(messaging, {
    serviceWorkerRegistration: reg,
    vapidKey: PUBLIC_VAPID_KEY,
  });
}
