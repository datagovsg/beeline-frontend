import _ from "lodash"

export default [
  "$scope",
  "$ionicHistory",
  "$stateParams",
  "$ionicPopup",
  "$ionicLoading",
  "RoutesService",
  "LiteRoutesService",
  "LiteRouteSubscriptionService",
  "UserService",
  "loadingSpinner",
  "MapService",
  "$state",
  function(
    $scope,
    $ionicHistory,
    $stateParams,
    $ionicPopup,
    $ionicLoading,
    RoutesService,
    LiteRoutesService,
    LiteRouteSubscriptionService,
    UserService,
    loadingSpinner,
    MapService,
    $state
  ) {
    // ------------------------------------------------------------------------
    // stateParams
    // ------------------------------------------------------------------------
    $scope.book.label = $stateParams.label

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    $scope.disp = {
      companyInfo: {},
      hasTrackingData: null,
      statusMessages: null,
      showHamburger: null,
    }

    // Default settings for various info used in the page
    $scope.book = {
      label: null,
      route: null,
      waitingForSubscriptionResult: false,
      isSubscribed: false,
      todayTrips: null,
      inServiceWindow: false,
      hasTrips: true,
    }

    // ------------------------------------------------------------------------
    // Data Loading
    // ------------------------------------------------------------------------
    let routePromise
    let subscriptionPromise

    routePromise = LiteRoutesService.fetchLiteRoute($scope.book.label)
    subscriptionPromise = LiteRouteSubscriptionService.isSubscribed(
      $scope.book.label
    )

    subscriptionPromise.then(response => {
      $scope.book.isSubscribed = response
    })

    routePromise.then(route => {
      $scope.book.route = route[$scope.book.label]
      // get route features
      RoutesService.getRouteFeatures($scope.book.route.id).then(data => {
        $scope.disp.features = data
      })
      $scope.book.route.trips = _.sortBy($scope.book.route.trips, trip => {
        return trip.date
      })
    })

    // ------------------------------------------------------------------------
    // Ionic events
    // ------------------------------------------------------------------------
    $scope.$on("$ionicView.enter", function() {
      if ($ionicHistory.backView()) {
        $scope.disp.showHamburger = false
      } else {
        $scope.disp.showHamburger = true
      }
    })

    $scope.$on("$ionicView.afterEnter", () => {
      // Must define leavePromise here because if we define
      // the handler for $ionicView.beforeLeave in .then(() => {})
      // the user might have already navigated away from the page, and
      // the event will not be fired
      const leavePromise = new Promise(resolve => {
        $scope.$on("$ionicView.beforeLeave", resolve)
      })

      sendTripsToMapView()

      const dataPromise = loadingSpinner(
        Promise.all([routePromise, subscriptionPromise]).then(() => {
          MapService.emit("startPingLoop")

          const listener = tripInfo => {
            updateTripInfo(tripInfo)
          }
          MapService.on("tripInfo", listener)
          leavePromise.then(() =>
            MapService.removeListener("tripInfo", listener)
          )
        })
      )

      Promise.all([dataPromise, leavePromise]).then(() => {
        MapService.emit("killPingLoop")
      })
    })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    $scope.$watch("book.todayTrips", trips => {
      if (!trips) return
      $scope.book.hasTrips = trips.length > 0
    })

    $scope.$watch("book.todayTrips", sendTripsToMapView)

    $scope.$watch(
      () => UserService.getUser() && UserService.getUser().id,
      userId => {
        $scope.isLoggedIn = Boolean(userId)
      }
    )

    $scope.$watchCollection(
      () => [].concat(LiteRouteSubscriptionService.getSubscriptionSummary()),
      newValue => {
        LiteRouteSubscriptionService.isSubscribed($scope.book.label).then(
          response => {
            if (response) {
              $scope.book.isSubscribed = true
            } else {
              $scope.book.isSubscribed = false
            }
          }
        )
      }
    )

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.login = function() {
      UserService.promptLogIn()
    }

    $scope.showConfirmationPopup = async function() {
      const response = await $ionicPopup.confirm({
        title: "Are you sure you want to bookmark this route?",
      })

      if (!response) return
      $scope.followRoute()
    }

    $scope.followRoute = async function() {
      try {
        $scope.book.waitingForSubscriptionResult = true

        const subscribeResult = await loadingSpinner(
          LiteRoutesService.subscribeLiteRoute($scope.book.label)
        )

        if (subscribeResult) {
          $scope.book.isSubscribed = true
          $ionicPopup
            .alert({
              title: "Success",
              template: `
            <div class="item item-text-wrap text-center ">
              <div>
                <img src="img/lite_success.svg">
              </div>
              <p>You bookmarked this route.<br>
              Track your bus on the day of the trip.
              </p>
            </div>
            `,
            })
            .then(() => {
              $state.transitionTo("tabs.yourRoutes")
            })
        }
      } catch (err) {
        await $ionicLoading.show({
          template: `
          <div>Error, please try again later.</div>
          `,
          duration: 1000,
        })
      } finally {
        $scope.book.waitingForSubscriptionResult = false
      }
    }

    // TODO: Move bulk of promptUntrack code into service or directive as both
    // LiteSummaryController and LiteRouteTrackerController uses it
    $scope.promptUntrack = async function() {
      const response = await $ionicPopup.confirm({
        title: "Are you sure you want to unbookmark this route?",
        subTitle:
          "This tracking-only route will be removed from " + "your trips list.",
      })

      if (!response) return

      try {
        $scope.book.waitingForSubscriptionResult = true

        const unsubscribeResult = await loadingSpinner(
          LiteRoutesService.unsubscribeLiteRoute($scope.book.label)
        )

        if (unsubscribeResult) {
          $scope.book.isSubscribed = false
        }

        if (!$scope.book.isSubscribed) {
          await $ionicLoading.show({
            template: `
            <div>Done!</div>
            `,
            duration: 1000,
          })
          $ionicHistory.goBack()
        }
      } catch (err) {
        await $ionicLoading.show({
          template: `
          <div>Error, please try again later.</div>
          `,
          duration: 1000,
        })
      } finally {
        $scope.book.waitingForSubscriptionResult = false
      }
    }

    // ------------------------------------------------------------------------
    // Helper Functions
    // ------------------------------------------------------------------------
    function sendTripsToMapView() {
      const todayTrips = $scope.book.todayTrips
      if (todayTrips && todayTrips.length > 0) {
        MapService.emit("ping-trips", todayTrips)
      }
    }

    function updateTripInfo(tripInfo) {
      $scope.disp.hasTrackingData = tripInfo.hasTrackingData
      $scope.disp.statusMessages = tripInfo.statusMessages
      $scope.$digest()
    }
  },
]
