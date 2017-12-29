import _ from "lodash"
import { onlyOneAtATime } from "../shared/util"
import querystring from "querystring"

angular.module("beeline").controller("KickstarterInstantController", [
  "$scope",
  "$state",
  "$stateParams",
  "$ionicPopup",
  "$http",
  "BookingService",
  "KickstarterService",
  "UserService",
  "StripeService",
  "loadingSpinner",
  function(
    $scope,
    $state,
    $stateParams,
    $ionicPopup,
    $http,
    BookingService,
    KickstarterService,
    UserService,
    StripeService,
    loadingSpinner
  ) {
    // $stateParams will contain `stops`: list of beeline-routing stops, and `arrivalTime`: arrivalTime at destination
    // We will fetch the necessary data from `routing.beeline.sg` and then display it
    const stopIndices = ($stateParams.stops || "")
      .split(",")
      .map(x => parseInt(x))
    const arrivalTime = parseInt($stateParams.arrivalTime)

    // Functions to load data from routing.beeline.sg
    /**
     * @param {Array<number>} stopIndices
     * @return {Promise<Array>} Stops and their details
     */
    function fetchRouteDetails(stopIndices) {
      return UserService.beeline({
        method: "GET",
        url:
          "/crowdstart/preview_instant?" +
          querystring.stringify({
            stops: JSON.stringify(stopIndices),
            arrivalTime,
          }),
      }).then(response => {
        const route = response.data

        return {
          // Convert date/time strings to date/time
          ...route,
          trips: [
            {
              ...route.trips[0],
              date: new Date(route.trips[0].date),
              tripStops: _.sortBy(
                route.trips[0].tripStops.map(ts => ({
                  ...ts,
                  time: new Date(ts.time),
                })),
                "time"
              ),
            },
          ],
          /* extra info required by kickstart-info */
          daysLeft: Math.ceil(
            (new Date(route.notes.crowdstartExpiry).getTime() - Date.now()) /
              24 *
              3600e3
          ),
        }
      })
    }

    // Properties
    $scope.routePreview = null
    $scope.agreeCrowdstartTerms = false

    fetchRouteDetails(stopIndices)
      .then(route => {
        $scope.routePreview = route
      })
      .catch(err => {
        $scope.routePreview = false
        console.error(err)
      })

    // Methods
    $scope.addCreditCard = onlyOneAtATime(async () => {
      const stripeToken = await StripeService.promptForToken(null, null, true)

      if (!stripeToken) return

      await loadingSpinner(UserService.savePaymentInfo(stripeToken.id))
    })

    $scope.login = UserService.promptLogIn

    $scope.createCrowdstart = onlyOneAtATime(async () => {
      return loadingSpinner(
        UserService.beeline({
          method: "POST",
          url: "/crowdstart/instant",
          data: {
            stops: stopIndices,
            arrivalTime,
          },
        }).then(response => {
          const routeId = response.data.route.id

          $state.go("tabs.crowdstart-recap", { routeId })
        })
      ).catch(err => {
        $ionicPopup.alert({
          title: _.get(err, "message") || _.get(err, "data.message"),
        })
      })
    })

    // State variables from services
    // $scope.user
    $scope.$watch(
      () => UserService.getUser(),
      user => {
        $scope.user = user
      }
    )

    // $scope.hasCreditCard
    $scope.$watch("user.savedPaymentInfo", user => {
      $scope.hasCreditCard = _.get(user, "sources.data.length", 0) > 0
    })
  },
])
