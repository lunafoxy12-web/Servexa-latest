// Firebase Cloud Messaging Service Worker
/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
// Configuration matches firebase-applet-config.json
firebase.initializeApp({
  apiKey: "AIzaSyBvH-6gtGVPY1acgiBvjjOOgQ8lPqJJhj0",
  projectId: "ai-studio-applet-webapp-d459f",
  messagingSenderId: "605253786987",
  appId: "1:605253786987:web:abfdb771dbaf544254802e"
});

let messaging = null;
try {
  messaging = firebase.messaging();
} catch (e) {
  console.log('[SW] Firebase messaging compat fallback:', e);
}

// Background push notification handler
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Servexa Alert', body: event.data.text() };
    }
  }

  const notificationTitle = data.notification?.title || data.title || 'Servexa Real-Time Alert';
  const notificationOptions = {
    body: data.notification?.body || data.body || 'You have an important update on Servexa.',
    icon: data.notification?.icon || '/servexa-icon.svg',
    badge: '/servexa-icon.svg',
    vibrate: [200, 100, 200],
    data: data.data || data,
    tag: data.tag || 'servexa-alert'
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

// Click handler for opening window on notification tap
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
