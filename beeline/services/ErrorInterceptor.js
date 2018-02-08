angular.module("beeline").factory("ErrorInterceptor", [
  "$injector",
  "$q",
  function($injector, $q) {
    return {
      // optional method
      responseError: function(rejection) {
        // do something on error
        if (rejection.status >= 500) {
          $injector
            .get("$http")({
              method: "GET",
              url: "https://datagovsg.github.io/beeline-annoucement/error.json",
            })
            .then(function(response) {
              let error = response.data && response.data.error_msg
              if (error) {
                $injector.get("$ionicPopup").alert({
                  title: "Sorry there's been a problem",
                  subTitle: error,
                })
              }
            })
        }
        return $q.reject(rejection)
      },
    }
  },
])
