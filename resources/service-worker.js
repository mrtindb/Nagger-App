const { test } = require("media-typer");

self.addEventListener('push', function(event) {
    //This extracts the payload data from the push event. The data is assumed to be in JSON format.
    // fields: title, body, url
    const data = event.data.json();
    console.log(data);
    const options = {body: data.body, test: 'test'};

    event.waitUntil(self.registration.showNotification(data.title, options));

});


/*
data:
{
    title
    body
    url    
}

*/


self.addEventListener('notificationclick', function(event) {
    console.log(event);
    console.log(event.notification);
    console.log(event.data);
    console.log(event.notification.data);
    const data = event.notification.data.json();
    event.waitUntil(clients.openWindow("https://someurl"+data.data.test));
});