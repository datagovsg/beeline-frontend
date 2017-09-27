
const app = angular.module('beeline')

const OneSignalPromise = new Promise((resolve, reject) => {
  app.run(['$ionicPlatform', 'UserService',
  function ($ionicPlatform, UserService) {
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

        // Whenever the user changes, inform our server that the user
        // has logged in with this particular device
        function synchronizeUserId() {
          return UserService.beeline({
            method: 'POST',
            url: '/user/push_notification_tag',
          })
          .then((result) => {
            window.plugins.OneSignal.sendTag('user_tag', result.data.tag)
          })
          .catch((err) => {
            if (err.status === 403 || err.status === 401) {
              window.plugins.OneSignal.sendTag('user_tag', '')
            }
          })
        }

        synchronizeUserId()
        UserService.userEvents.on('userChanged', synchronizeUserId)
      }
      // Call syncHashedEmail anywhere in your app if you have the user's email.
      // This improves the effectiveness of OneSignal's "best-time" notification scheduling feature.
      // window.plugins.OneSignal.syncHashedEmail(userEmail);
    })
  }])
  .factory('OneSignalPromise', function () {
    return OneSignalPromise
  })
  .factory('OneSignal', function (OneSignalPromise) {
    return {
      unsubscribe () {
        return OneSignalPromise.then((OneSignal) => {
          OneSignal.setSubscription(false)
        })
      }
    }
  })
})
