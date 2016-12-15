export default function($cordovaSocialSharing) {
  return {
    replace: true,
    restrict: 'E',
    template: `<div class="item item-text-wrap">
                <div class="share-box">
                  Share this campaign to your friends and colleagues to increase the chance of activating this route!
                  <div class="text-center">
                    <textarea>{{shareLink}}</textarea>
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
      'routeId': '<',
    },
    link: function(scope, element, attributes) {
      scope.showCopy = !window.cordova || false;
      //if has cordova no need to show shareLink text area
      scope.shareLink = "Hey, check out this new Crowdstart route from Beeline! https://app.beeline.sg/#/tabs/crowdstart/"+scope.routeId+"/detail";

      scope.shareAnywhere = function() {
        $cordovaSocialSharing.share("Hey, check out this new Crowdstart route from Beeline!",
          "New Beeline Crowdstart Route", null, "https://app.beeline.sg/#/tabs/crowdstart/"+scope.routeId+"/detail");
      };
    },
  };
}
