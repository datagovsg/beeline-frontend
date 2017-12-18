import querystring from "querystring"

angular.module("beeline").directive("poweredByBeeline", [
  "$rootScope",
  "p",
  function($rootScope, p) {
    return {
      template: require("./poweredByBeeline.html"),
      restrict: "E",
      replace: false,
      scope: {
        powerHide: "<?",
        suggestHide: "<?",
        builtByShow: "<?",
      },
      link: function(scope, elem, attr) {
        scope.openSuggestionLink = function(event) {
          event.preventDefault()
          let appName = $rootScope.o.APP.NAME.replace(/\s/g, "")
          window.open(
            "https://www.beeline.sg/suggest.html#" +
              querystring.stringify({ referrer: appName }),
            "_system"
          )
        }
        scope.openLink = function(event, url) {
          event.preventDefault()
          window.open(url, "_system")
        }
        scope.powerHide = scope.powerHide
          ? scope.powerHide
          : $rootScope.o.APP.NAME == "Beeline"
        scope.transportCompanyId = p.transportCompanyId
      },
    }
  },
])
