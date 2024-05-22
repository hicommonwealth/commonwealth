import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

// FIXME move to env...
const firebaseConfig = {
  apiKey: 'AIzaSyA93Av0xLkOB_nP9hyzhGYg78n9JEfS1bQ',
  authDomain: 'common-staging-384806.firebaseapp.com',
  projectId: 'common-staging-384806',
  storageBucket: 'common-staging-384806.appspot.com',
  messagingSenderId: '158803639844',
  appId: '1:158803639844:web:b212938a52d995c6d862b1',
  measurementId: 'G-4PNZZQDNFE',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = getMessaging(app);

export function getFirebaseMessaging() {
  return messaging;
}
