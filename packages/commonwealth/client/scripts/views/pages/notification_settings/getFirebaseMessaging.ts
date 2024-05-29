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

// FIXME: move to env...
const PUBLIC_VAPID_KEY =
  'BDMNzw-2Dm1HcE9hFr3T4Li_pCp_w7L4tCcq-OETD71J1DdC0VgIogt6rC8Hh0bHtTacyZHSoQ1ax5KCU4ZjS30';

const PUBLIC_FIREBASE_CONFIG = process.env.PUBLIC_FIREBASE_CONFIG
  ? JSON.parse(process.env.PUBLIC_FIREBASE_CONFIG)
  : DEFAULT_FIREBASE_CONFIG;

// Initialize Firebase
const app = initializeApp(PUBLIC_FIREBASE_CONFIG);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = getMessaging(app);

export function getFirebaseMessaging() {
  return messaging;
}

export async function getFirebaseMessagingToken() {
  return await getToken(messaging, { vapidKey: PUBLIC_VAPID_KEY });
}
