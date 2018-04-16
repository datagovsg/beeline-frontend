import { SafeScheduler } from "../SafeScheduler"

// since it's broker, we allow 2-way binding for now and
// view update the data model which controll relies on
angular.module("beeline").directive("dailyTripsBroker", [
  "LiteRoutesService",
  "$timeout",
  function(LiteRoutesService, $timeout) {
    return {
      replace: true,
      restrict: "E",
      template: "",
      scope: {
        tripLabel: "<",
        dailyTripIds: "=",
        inServiceWindow: "=",
      },
      link: function(scope, element, attributes) {
        let timeout

        scope.dailyTripIds = null

        scope.$watch("tripLabel", label => {
          if (timeout) timeout.stop()

          if (!label) {
            return
          }

          const midnightTomorrow = new Date().setHours(24, 1, 0)
          timeout = new SafeScheduler(() => grabTrips(label), midnightTomorrow)

          timeout.start()
        })

        scope.$on("$destroy", () => {
          if (timeout) timeout.stop()
        })

        /**
         * Lookup trips and set the state of inServiceWindow and dailyTrips
         * @param {string} label - the route label
         * @return {Promise} the promise fetching the route and
         * extracting the relevant information
         */
        function grabTrips(label) {
          return LiteRoutesService.fetchLiteRoute(label, true).then(
            response => {
              let route = response[scope.tripLabel]
              scope.dailyTripIds = route.tripIds
              scheduleServiceWindowChanges(route)
            }
          )
        }

        /**
         * Schedules the changing of scope.inServiceWindow
         * @param {Object} route - the route
         */
        function scheduleServiceWindowChanges(route) {
          scope.inServiceWindow = false

          const now = Date.now()
          const startMillis = new Date(route.startTime).getTime()
          const endMillis = new Date(route.endTime).getTime()

          scope.inServiceWindow = startMillis <= now && now <= endMillis

          const scheduleStateChange = (state, millis) => {
            let firstRun = true
            return new SafeScheduler(
              () =>
                new Promise(resolve => {
                  if (firstRun) {
                    firstRun = false
                  } else {
                    scope.inServiceWindow = state
                  }
                  resolve()
                }),
              millis
            )
          }

          if (now < startMillis) {
            scope.serviceBegin = scheduleStateChange(true, startMillis)
            scope.serviceBegin.start()

            scope.$on("$destroy", () => {
              if (scope.serviceBegin) scope.serviceBegin.stop()
            })
          }

          if (now < endMillis) {
            scope.serviceEnd = scheduleStateChange(false, endMillis)
            scope.serviceEnd.start()

            scope.$on("$destroy", () => {
              if (scope.serviceEnd) scope.serviceEnd.stop()
            })
          }
        }
      },
    }
  },
])
