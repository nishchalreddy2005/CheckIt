/// <reference lib="WebWorker" />

// Use self as any to skip type checking issues in this environment or cast correctly
const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('push', (event: any) => {
    const data = event.data ? event.data.json() : { title: 'CheckIt Notification', body: 'You have a new update!' };

    const options = {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        data: data.url || '/'
    };

    event.waitUntil(
        sw.registration.showNotification(data.title, options)
    );
});

sw.addEventListener('notificationclick', (event: any) => {
    event.notification.close();
    event.waitUntil(
        sw.clients.openWindow(event.notification.data || '/')
    );
});
