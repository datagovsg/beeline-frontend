
const app = angular.module('beeline')

const OneSignalPromise = new Promise((resolve, reject) => {
  app.run(function ($ionicPlatform) {
    $ionicPlatform.ready(function() {
      // Enable to debug issues.
      // window.plugins.OneSignal.setLogLevel({logLevel: 4, visualLevel: 4});

      var notificationOpenedCallback = function(jsonData) {
        console.log('notificationOpenedCallback: ' + JSON.stringify(jsonData));
      };

      if (window.plugins && window.plugins.OneSignal) {
        window.plugins.OneSignal
          .startInit("8fe3f546-fc30-4076-ab13-9ecf006c55b0")
          .handleNotificationOpened(notificationOpenedCallback)
          .endInit();

        // Resolve the plugin
        resolve(window.plugins.OneSignal)
      }
      // Call syncHashedEmail anywhere in your app if you have the user's email.
      // This improves the effectiveness of OneSignal's "best-time" notification scheduling feature.
      // window.plugins.OneSignal.syncHashedEmail(userEmail);
    })
  })
  .factory('OneSignalPromise', function () {
    return OneSignalPromise
  })
})
