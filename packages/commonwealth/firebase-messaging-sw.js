importScripts(
  'https://www.gstatic.com/firebasejs/9.7.0/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/9.7.0/firebase-messaging-compat.js'
);

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: 'AIzaSyA93Av0xLkOB_nP9hyzhGYg78n9JEfS1bQ',
  authDomain: 'common-staging-384806.firebaseapp.com',
  projectId: 'common-staging-384806',
  storageBucket: 'common-staging-384806.appspot.com',
  messagingSenderId: '158803639844',
  appId: '1:158803639844:web:b212938a52d995c6d862b1',
  measurementId: 'G-4PNZZQDNFE',
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );

  if (payload.data && data.title) {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: './static/brand_assets.32x32.png',
      data: {
        link: '/notifications',
      },
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});
