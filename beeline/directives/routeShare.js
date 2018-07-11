angular.module('beeline').directive('routeShare', [
  '$cordovaSocialSharing',
  '$ionicPopup',
  '$rootScope',
  function ($cordovaSocialSharing, $ionicPopup, $rootScope) {
    return {
      replace: true,
      restrict: 'E',
      template: `<div>
                  <button class="button button-clear" ng-click="shareAnywhere()" ng-if="!showCopy">
                    <i class="fa fa-share-alt"></i>
                  </button>
                  <button class="button button-clear" ng-if="showCopy" ngclipboard data-clipboard-text={{shareLink}} ng-click="feedback()">
                    <i class="fa fa-share-alt"></i>
                  </button>
                </div>`,
      scope: {
        routeId: '<',
        routeType: '<',
      },
      link: function (scope, element, attributes) {
        scope.showCopy = !window.cordova || false

        const domain =
          $rootScope.o.APP.NAME === 'GrabShuttle'
            ? 'https://grabshuttle.beeline.sg'
            : 'https://app.beeline.sg'
        if (scope.routeType === 'normal') {
          scope.shareLink = `${domain}/tabs/route/${scope.routeId}`
        } else if (scope.routeType === 'crowdstart') {
          scope.shareLink = `${domain}/tabs/crowdstart/${scope.routeId}/detail`
        } else if (scope.routeType === 'lite') {
          scope.shareLink = `${domain}/tabs/lite/detail/${scope.routeId}`
        }

        scope.shareAnywhere = function () {
          $cordovaSocialSharing.share(scope.shareLink)
        }

        scope.feedback = function () {
          $ionicPopup.alert({
            title: 'URL is copied to clipboard',
          })
        }
      },
    }
  },
])
