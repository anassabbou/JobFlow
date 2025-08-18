// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBkDUyt8SB3YOGK2tJ41EBt50wS_ii5twM",
  authDomain: "jobflow-8bf97.firebaseapp.com",
  projectId: "jobflow-8bf97",
  storageBucket: "jobflow-8bf97.firebasestorage.app",
  messagingSenderId: "670232247500",
  appId: "1:670232247500:web:ffe17002807f77aba59669"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Job Application Update';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update',
    icon: '/vite.svg',
    badge: '/vite.svg',
    data: payload.data,
    actions: [
      {
        action: 'view',
        title: 'View Application'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'view') {
    // Open the app and navigate to the specific application
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});