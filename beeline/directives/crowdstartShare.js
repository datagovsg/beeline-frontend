export default [
  "$cordovaSocialSharing",
  "rootScope",
  function($cordovaSocialSharing, $rootScope) {
    return {
      replace: true,
      restrict: "E",
      template: `<div class="item item-text-wrap">
                  <div class="share-box">
                    Share this campaign to your friends and colleagues to increase the chance of activating this route!
                    <div class="text-center">
                      <textarea rows="4">{{shareLink}}</textarea>
                    </div>
                    <div class="text-right">
                      <button class="button button-outline button-royal small-button" ng-click="shareAnywhere()" ng-if="!showCopy">Share</button>
                      <button class="button button-outline button-royal small-button" ng-if="showCopy" ngclipboard data-clipboard-text={{shareLink}}>
                          Copy
                      </button>
                    </div>
                  </div>
                </div>`,
      scope: {
        routeId: "<",
      },
      link: function(scope, element, attributes) {
        scope.showCopy = !window.cordova || false
        // if has cordova no need to show shareLink text area
        // scope.shareLink = "Hey, check out this new Crowdstart route from "+$rootScope.o.APP.NAME +"! "+$rootScope.o.APP.INDEX+"#/tabs/crowdstart/"+scope.routeId+"/detail";
        const domain = $rootScope.o.APP.INDEX === 'https://app.beeline.sg' ? 'https://app.beeline.sg' : 'https://grabshuttle.beeline.sg'
        scope.shareLink =  `Hey, check out this new Crowdstart route from ${$rootScope.o.APP.NAME}! ${domain}/tabs/crowdstart/${scope.routeId}/detail`

        scope.shareAnywhere = function() {
          $cordovaSocialSharing.share(
            `Hey, check out this new Crowdstart route from ${
              $rootScope.o.APP.NAME
            }!`,
            `New ${$rootScope.o.APP.NAME} Crowdstart Route`,
            null,
            `${$rootScope.o.APP.INDEX}#/tabs/crowdstart/${scope.routeId}/detail`
          )
        }
      },
    }
  },
]
