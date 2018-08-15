/* Register the service worker */
regServiceWorker = () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('../sw.js', {
                scope: '/'
            })
            .then(reg => {
                console.log('Service worker registration successful: ' + reg.scope);

                // if there's no controller, this page wasn't loaded
                // via a service worker, so they're looking at the latest version.
                // In that case, exit early
                if (!navigator.serviceWorker.controller) {
                    return;
                }

                // Listen for the controlling service worker changing
                // and reload the page
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('Refreshing the page');

                    window.location.reload();
                });

                // Init the toast dismiss button
                toastDismiss();

                // if there's an updated worker already waiting, handle the update
                if (reg.waiting) {
                    updateReady(reg.waiting);
                    return;
                }

                // if there's an updated worker installing, track its
                // progress. If it becomes "installed", handle the update
                if (reg.installing) {
                    trackInstalling(reg.installing);
                    return;
                }

                // otherwise, listen for new installing workers arriving.
                // Do the same process
                reg.addEventListener('updatefound', function () {
                    // If updatefound is fired, it means that there's
                    // a new service worker being installed.
                    trackInstalling(reg.installing);
                });

            })
            .catch(error => {
                console.log('Service worker registration failed: ' + error);
            });
    } else {
        console.log('Service workers are not supported.');
    }
};

trackInstalling = (installingWorker) => {
    console.log('A new service worker is being installed:', installingWorker);
    // Listening for changes to the installing service worker's
    installingWorker.addEventListener('statechange', () => {
        if (this.state === 'installed') {
            updateReady(reg.waiting);
        }
    });
};

updateReady = (worker) => {
    console.log('New Service Worker waiting');
    const toast = document.getElementById('toast');
    const button = document.getElementById('toast-button-refresh');
    if (button) {
        button.addEventListener('click', () => {
            worker.postMessage({
                action: 'skipWaiting'
            });
            toast.classList.remove('show-toast');
        });
    }

    if (toast) {
        toast.classList.add('show-toast');
    }
};

toastDismiss = () => {
    const button = document.getElementById('toast-button-dismiss');
    if (button) {
        button.addEventListener('click', (event) => {
            console.log('Removing toats');

            event.target.parentElement.classList.remove('show-toast');
        });
    }
};
