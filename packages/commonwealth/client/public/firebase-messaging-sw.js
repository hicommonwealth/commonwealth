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

  const img = '/static/img/branding/common.png';

  // NOTE that the raw event can't be called because it has a custom toJSON
  // implementation and all you can see is "isTrusted": true.

  const event_data = event.data.json();

  // we're keeping this JSON stringify here because setting breakpoints in service
  // workers is inconsistent and this is the only way to see the REAL JSON sent
  // from Knock. Note that this is different from what we see in their logs
  // and there are different properties here including event_data.notification
  // which is not actually shown in the Knock console.
  console.log(
    'Received event data from Knock: ',
    JSON.stringify(event_data, null, 2),
  );

  // we MUST handle body, title, and url computation here... for all workflow
  // message types including comment-created,

  const title = event_data.notification.title || event_data.title || 'No title';
  const body =
    event_data.notification.body ||
    event_data.body ||
    event_data.comment_body ||
    'No body';
  const url =
    event_data.notification.url ||
    event_data.url ||
    event_data.data.comment_url ||
    event_data.data.object_url ||
    event_data.data.community_stakes_url ||
    'https://common.xyz';

  const options = {
    body,
    image: img,
    icon: img,
    badge: img,
    // tag: 'notification-tag', // Optional: A tag for the notification (useful for stacking notifications)
    data: {
      url,
    },
  };

  // Display the notification
  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
  event.waitUntil(self.registration.showNotification(title, options));
});

// Listen for 'notificationclick' events to handle notification interactions
self.addEventListener('notificationclick', function (event) {
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
