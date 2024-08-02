self.addEventListener('push', function(event) {
    //This extracts the payload data from the push event. The data is assumed to be in JSON format.
    // fields: title, body, url
    const data = event.data.json();
    const options = {body: data.body, url: data.url};

    event.waitUntil(self.registration.showNotification(data.title, options));

});

self.addEventListener('notificationclick', function(event) {
    const data = event.data.json();
    
});