import ticketDetailTemplate from "./ticketDetail.html"
import assert from "assert"

angular.module("beeline").directive("ticketDetail", [
  "$stateParams",
  "TicketService",
  "CompanyService",
  "TripService",
  "UserService",
  "RoutesService",
  "MapService",
  "MapOptions",
  "uiGmapGoogleMapApi",
  "MapViewFactory",
  function(
    $stateParams,
    TicketService,
    CompanyService,
    TripService,
    UserService,
    RoutesService,
    MapService,
    MapOptions,
    uiGmapGoogleMapApi,
    MapViewFactory
  ) {
    return {
      restrict: "E",
      template: ticketDetailTemplate,
      scope: {
        ticketId: "<?",
      },
      link: function(scope, element, attributes) {
        // ------------------------------------------------------------------------
        // Data Initialization
        // ------------------------------------------------------------------------

        scope.disp = {
          vehicle: null,
          driver: null,
          tripStatus: null,
        }
        scope.latestInfo = {
          vehicleId: null,
          driverId: null,
        }

        scope.modalMap = MapOptions.defaultMapOptions({
          busLocation: {
            coordinates: null,
            icon: null,
          },
        })

        scope.ticketId = Number(scope.ticketId) || Number($stateParams.ticketId)

        scope.user = UserService.getUser()

        // ------------------------------------------------------------------------
        // Data Loading
        // ------------------------------------------------------------------------
        // Resolved when the map is initialized
        const gmapIsReady = new Promise((resolve, reject) => {
          let resolved = false
          scope.$watch("modalMap.control.getGMap", function() {
            if (scope.modalMap.control.getGMap) {
              if (!resolved) {
                resolved = true
                resolve()
              }
            }
          })
        })

        gmapIsReady.then(() => {
          MapOptions.disableMapLinks()
        })

        uiGmapGoogleMapApi.then(googleMaps => {
          scope.modalMap.busLocation.icon = {
            url: `img/busMarker.svg`,
            scaledSize: new googleMaps.Size(68, 86),
            anchor: new googleMaps.Point(34, 78),
          }
        })

        MapViewFactory.init(scope)

        const recentTimeBound = 2 * 60 * 60000
        const pingLoop = MapViewFactory.pingLoop(scope, recentTimeBound)
        const statusLoop = MapViewFactory.statusLoop(scope)
        MapViewFactory.setupPingLoops(scope, pingLoop, statusLoop)

        const ticketPromise = TicketService.getTicketById(scope.ticketId)
        const tripPromise = ticketPromise.then(ticket => {
          return TripService.getTripData(Number(ticket.alightStop.tripId))
        })
        const routePromise = tripPromise.then(trip => {
          return RoutesService.getRoute(Number(trip.routeId))
        })
        const companyPromise = routePromise.then(route => {
          return CompanyService.getCompany(Number(route.transportCompanyId))
        })
        companyPromise.then(company => {
          scope.company = company
        })
        ticketPromise.then(ticket => {
          scope.mapObject.boardStop = ticket.boardStop
          scope.mapObject.alightStop = ticket.alightStop
          scope.ticket = ticket
          scope.trip = ticket.boardStop.trip
          scope.tripCode = ticket.tripCode
          sentTripToMapView()
          updateLatestInfo(ticket.boardStop.trip.id)
        })
        tripPromise.then(trip => {
          let stops = trip.tripStops.map(ts => {
            return _.assign(ts.stop, { canBoard: ts.canBoard })
          })
          scope.mapObject.stops = stops
        })
        routePromise.then(route => {
          scope.route = route
          if (route.path) {
            RoutesService.decodeRoutePath(route.path)
              .then(decodedPath => {
                scope.mapObject.routePath = decodedPath
              })
              .catch(() => {
                scope.mapObject.routePath = []
              })
          }
        })

        // ------------------------------------------------------------------------
        // UI Hooks
        // ------------------------------------------------------------------------

        scope.showTerms = companyId => {
          CompanyService.showTerms(companyId)
        }

        // ------------------------------------------------------------------------
        // Event handlers
        // ------------------------------------------------------------------------

        // when leaving tabs.route-detail or tabs.ticket-detail
        scope.$on("$destroy", () => {
          deregister()
        })

        // when leaving tabs.my-booking-routes or tabs.route-detail
        scope.$on("leavingMyBookingRoute", (event, args) => {
          if (
            args.ticketId &&
            scope.ticket &&
            scope.ticket.id == args.ticketId
          ) {
            deregister()
          }
        })

        scope.$on("enteringMyBookingRoute", (event, args) => {
          sentTripToMapView()
        })

        // ------------------------------------------------------------------------
        // Helper Functions
        // ------------------------------------------------------------------------

        const updateLatestInfo = id =>
          TripService.latestInfo(Number(id)).then(info => {
            scope.disp = {
              vehicle:
                info &&
                info.trip &&
                info.trip.vehicle &&
                info.trip.vehicle.vehicleNumber,
              driver:
                info && info.trip && info.trip.driver && info.trip.driver.name,
            }
            scope.latestInfo = {
              vehicleId:
                info && info.trip && info.trip.vehicle && info.trip.vehicle.id,
              driverId:
                info && info.trip && info.trip.driver && info.trip.driver.id,
            }
          })

        const sentTripToMapView = () => {
          const trip = scope.trip
          if (trip) {
            MapService.emit("ping-trips", [trip])
            MapService.emit("startPingLoop")
            MapService.on("ping", updateIfVehicleOrDriverChanged)
            MapService.on("status", updateStatus)
          }
        }

        const updateIfVehicleOrDriverChanged = ping => {
          if (
            scope.latestInfo.vehicleId !== ping.vehicleId ||
            scope.latestInfo.driverId !== ping.driverId
          ) {
            updateLatestInfo(ping.tripId)
          }
        }

        const updateStatus = status => {
          scope.disp.tripStatus = status.status
        }

        const deregister = function() {
          MapService.emit("killPingLoop")
          MapService.removeListener("ping", updateIfVehicleOrDriverChanged)
          MapService.removeListener("status", updateStatus)
        }
      },
    }
  },
])
