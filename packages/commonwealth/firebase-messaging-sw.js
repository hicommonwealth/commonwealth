// NOTE: this needs to be done in .js due to a Typescript issue which is a bit of
// a nightmare.  What's happening is that we can't use Typescript types as our
// 'libs' configuration requires 'ServiceWorker' but that means that both 'dom'
// and ServiceWorker types are available in two places which are wrong.  The dom
// APIs are available to the service worker (which is wrong) and the ServiceWorker
// APIs are available to React (the browser) which is also wrong.  Additionally,
// the types for the service worker are actually wrong and 'showNotification'
// does not appear to be in the ServiceWorker types.  To handle this properly
// we would need to upgrade our Typescript to 5.4.x and create a dedicated
// typescript package JUST for our service worker which I feel is a waste of time
// since our service worker is just one file and less than 100 lines of code

// Listen for 'push' events from the push service
self.addEventListener('push', function (event) {
  if (!event.data) {
    console.warn('Push notification lacks data. Ignoring');
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: 'images/icon.png', // Replace with the path to your notification icon
    badge: 'images/badge.png', // Replace with the path to your notification badge
    tag: 'notification-tag', // Optional: A tag for the notification (useful for stacking notifications)
    data: {
      url: data.url, // Optional: URL to open when the user clicks the notification
    },
  };

  // Display the notification
  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Listen for 'notificationclick' events to handle notification interactions
self.addEventListener('notificationclick', function (event) {
  // Close the notification
  event.notification.close();

  // Extract the data from the notification
  const { url } = event.notification.data;

  // // Perform an action when the notification is clicked, like opening a URL
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if there is at least one client (browser tab)
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // If the app is already open in a tab, focus it
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // If no clients are found, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    }),
  );
});

// Install and activate events (basic handling)
self.addEventListener('install', (event) => {
  // Activate worker immediately
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  // Become available to all pages
  event.waitUntil(self.clients.claim());
});
