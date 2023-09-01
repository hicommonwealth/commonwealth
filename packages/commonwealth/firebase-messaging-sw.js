importScripts(
  'https://www.gstatic.com/firebasejs/9.7.0/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/9.7.0/firebase-messaging-compat.js'
);

firebase.initializeApp({
  apiKey: 'AIzaSyA93Av0xLkOB_nP9hyzhGYg78n9JEfS1bQ',
  authDomain: 'common-staging-384806.firebaseapp.com',
  projectId: 'common-staging-384806',
  storageBucket: 'common-staging-384806.appspot.com',
  messagingSenderId: '158803639844',
  appId: '1:158803639844:web:b212938a52d995c6d862b1',
  measurementId: 'G-4PNZZQDNFE',
});

const messaging = firebase.messaging();
