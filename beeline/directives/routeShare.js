
angular.module('beeline').directive('routeShare', ['$cordovaSocialSharing', '$ionicPopup', '$rootScope',
  function($cordovaSocialSharing, $ionicPopup, $rootScope) {
    return {
      replace: true,
      restrict: 'E',
      template: `<div>
                  <button class="button button-clear" ng-click="shareAnywhere()" ng-if="!showCopy">
                    <i class="icon ion-share">share</i>
                  </button>
                  <button class="button button-clear" ng-if="showCopy" ngclipboard data-clipboard-text={{shareLink}} ng-click="feedback()">
                    <i class="icon ion-share">copy</i>
                  </button>
                </div>`,
      scope: {
        'isNormalRoute': '<',
        'routeId': '<',
      },
      link: function(scope, element, attributes) {

        scope.showCopy = !window.cordova
        console.log($rootScope.o.APP.INDEX)
        if(scope.isNormalRoute) {
          scope.shareLink =   `${$rootScope.o.APP.INDEX}/tabs/route/${scope.routeId}`
        } else {
          scope.shareLink =   `${$rootScope.o.APP.INDEX}/tabs/crowdstart/${scope.routeId}/detail`
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
