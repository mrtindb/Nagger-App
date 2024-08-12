export function registerServiceWorker() {
    if ('Notification' in window && (navigator.serviceWorker || 'serviceWorker' in navigator)) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {

          if ('PushManager' in window) {
            navigator.serviceWorker.register('/static/service-worker.js').then(function (registration) {

              subscribeUserToPushNotifications();

            }).catch(function (error) {
              alert(error);
            });
          }
          else {
            alert('PushManager is not supported in this browser.');
          }

        } else {
          // Permissions denied
          alert('Notifications are disabled. Please enable them in your browser settings.');
        }
      });
    }
    else alert('Notifications are not supported in this browser. Please use a different browser.');
  };

  async function sendSubscriptionToServer(subscription) {
    return await fetch('/subscribe', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    });
  }

  function subscribeUserToPushNotifications() {
    navigator.serviceWorker.ready.then(function (registration) {
      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array('BDc4tPwlYDOyk7AWjeVOWnnlHMh0_IieE7uMb0g-ertvHKhf-sFKgR5_enTsTU5Pzpxq2rreqkka3T0-MsY5Q5Y')
      });
    }).then(async function (subscription) {
      let alert = document.getElementById('success-alert');
      let response = await sendSubscriptionToServer(subscription);
      
      if(response.status===201) {
        alert.classList.remove('d-none');
        let button = document.getElementById('enableNotificationsButton');
        button.setAttribute('disabled', 'true');
        setTimeout(() => {
          alert.classList.add('d-none');
        }, 3000);
      }
    }).catch(function (error) {
      console.error('Failed to subscribe the user: ', error);
    });
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    console.log(outputArray);
    return outputArray;
  }
