const queryString = require("querystring")

export default [
  "$scope",
  "$state",
  "$stateParams",
  "$ionicPopup",
  "$ionicLoading",
  "UserService",
  async function(
    $scope,
    $state,
    $stateParams,
    $ionicPopup,
    $ionicLoading,
    UserService
  ) {
    // Verify if refCode is provided
    $scope.isLoaded = false
    $ionicLoading.show()

    $scope.refCode = $stateParams.refCode

    if ($scope.refCode) {
      const query = queryString.stringify({ code: $scope.refCode })

      try {
        const refCodeOwner = await UserService.beeline({
          method: "GET",
          url: "/promotions/refCodeOwner?" + query,
        })

        if (refCodeOwner) {
          $scope.refCodeOwner = refCodeOwner.data
        }
      } catch (error) {
        $ionicPopup.alert({
          title: error.data.message,
          subTitle: error.statusText,
        })
      }
    }

    $ionicLoading.hide()
    $scope.isLoaded = true

    $scope.data = {}

    $scope.register = async function() {
      await UserService.registerViaReferralWelcome(
        $scope.data.telephone,
        $scope.refCode,
        $scope.refCodeOwner
      )

      $state.go("tabs.routes")

      await $ionicPopup.alert({
        title: "Welcome to Beeline",
        subTitle:
          "Success! You can now use your $10 ride credits when you " +
          "make bookings.",
      })
    }
  },
]
