self.addEventListener('push', (event) => {
    try {
        const data = event.data ? event.data.json() : {};
        console.log(data);
        const shouldPlaySound = data.data && data.data.sound;
        
        event.waitUntil(
            shouldPlaySound ? playNotificationSound(data.data.sound) : Promise.resolve()
        );
    } catch (error) {
        console.error('Error handling push notification:', error);
    }
});


// Function to play notification sound on active clients
async function playNotificationSound(soundType) {
    try {
        const clients = await self.clients.matchAll({ 
            type: 'window', 
            includeUncontrolled: true 
        });
        
        // Send message to all active clients to play sound
        clients.forEach(client => {
            client.postMessage({
                type: 'PLAY_NOTIFICATION_SOUND',
                sound: soundType
            });
        });
    } catch (error) {
        console.error('Error playing notification sound:', error);
    }
}

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already a window open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        // Navigate to the URL and focus the existing window
                        return client.focus().then(() => client.navigate(urlToOpen));
                    }
                }
                // If no window is open, open a new one
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
            .catch((error) => {
                console.error('Error handling notification click:', error);
            })
    );
});