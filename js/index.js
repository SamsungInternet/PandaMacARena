var iframe = document.getElementById('');
var urlid = '7w7pAfrCfjovwykkEeRFLGw5SXS';

var client = new Sketchfab(iframe);

client.init( urlid, {
    success: function onSuccess( api ) {
        api.start();
        api.addEventListener('viewerready', function() {
            console.log('Viewer is ready');
        });
    },
    error: function onError(error) {
        console.log('Viewer error', error);
    }
});
