import { SafeScheduler } from "../SafeScheduler"
// since it's broker, we allow 2-way binding for now and
// view update the data model which controll relies on
export default [
  "LiteRoutesService",
  "$timeout",
  function(LiteRoutesService, $timeout) {
    return {
      replace: true,
      restrict: "E",
      template: "",
      scope: {
        tripLabel: "<",
        dailyTrips: "=",
      },
      link: function(scope, element, attributes) {
        let timeout

        scope.dailyTrips = null

        scope.$watch("tripLabel", label => {
          if (timeout) timeout.stop()

          if (!label) {
            return
          }

          timeout = new SafeScheduler(() => grabTrips(label), 24, 1, 0)

          timeout.start()
        })

        scope.$on("$destroy", () => {
          if (timeout) timeout.stop()
        })

        function grabTrips(label) {
          return LiteRoutesService.fetchLiteRoute(label, true).then(
            response => {
              let route = response[scope.tripLabel]

              let now = new Date()
              let todayTrips = route.trips.filter(
                trip =>
                  trip.isRunning &&
                  new Date(trip.date).getTime() ==
                    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
              )

              scope.dailyTrips = _.sortBy(
                todayTrips,
                trip => new Date(trip.tripStops[0].time)
              )
            }
          )
        }
      },
    }
  },
]
