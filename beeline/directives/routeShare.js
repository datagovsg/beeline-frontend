
angular.module('beeline').directive('routeShare', ['$cordovaSocialSharing', '$ionicPopup', '$rootScope',
  function($cordovaSocialSharing, $ionicPopup, $rootScope) {
    return {
      replace: true,
      restrict: 'E',
      template: `<div>
                  <button class="button button-clear" ng-click="shareAnywhere()" ng-if="!showCopy">
                    <i class="icon ion-share"></i>
                  </button>
                  <button class="button button-clear" ng-if="showCopy" ngclipboard data-clipboard-text={{shareLink}} ng-click="feedback()">
                    <i class="icon ion-share"></i>
                  </button>
                </div>`,
      scope: {
        'isNormalRoute': '<',
        'routeId': '<',
      },
      link: function(scope, element, attributes) {

        scope.showCopy = !window.cordova || false

        const domain = $rootScope.o.APP.NAME === 'GrabShuttle' ?  'https://grabshuttle.beeline.sg' : 'https://app.beeline.sg'
        if(scope.isNormalRoute) {
          scope.shareLink =   `${domain}/tabs/route/${scope.routeId}`
        } else {
          scope.shareLink =   `${domain}/tabs/crowdstart/${scope.routeId}/detail`
        }

        scope.shareAnywhere = function() {
          $cordovaSocialSharing.share(scope.shareLink);
        }

        scope.feedback = function() {
          $ionicPopup.alert({
            title: 'URL is copied to clipboard',
          })
        }

      }
    }
}])
