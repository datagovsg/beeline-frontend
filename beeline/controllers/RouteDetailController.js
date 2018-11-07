import ticketDetailModalTemplate from '../templates/ticket-detail-modal.html'
import expiryModalTemplate from '../templates/route-pass-expiry-modal.html'

export default [
  '$scope',
  '$state',
  '$stateParams',
  '$ionicLoading',
  '$ionicModal',
  '$ionicPopup',
  '$rootScope',
  'UserService',
  'RoutesService',
  'BookingService',
  'CompanyService',
  'FastCheckoutService',
  'GoogleAnalytics',
  'MapService',
  'TicketService',
  'TripService',
  '$ionicHistory',
  function (
    $scope,
    $state,
    $stateParams,
    $ionicLoading,
    $ionicModal,
    $ionicPopup,
    $rootScope,
    UserService,
    RoutesService,
    BookingService,
    CompanyService,
    FastCheckoutService,
    GoogleAnalytics,
    MapService,
    TicketService,
    TripService,
    $ionicHistory
  ) {
    // ------------------------------------------------------------------------
    // Helper Functions
    // ------------------------------------------------------------------------
    const initTicketModal = function initTicketModal () {
      let scope = $rootScope.$new()
      scope.ticketId = $scope.data.nextTripTicketId
      scope.functions = {}
      $scope.modalFunctions = scope.functions
      let modal = $ionicModal.fromTemplate(ticketDetailModalTemplate, {
        scope: scope,
        animation: 'slide-in-up',
      })
      scope.modal = modal
      return modal
    }

    const initExpiryModal = function initExpiryModal () {
      let scope = $rootScope.$new()
      scope.routeId = $scope.data.routeId

      let modal = $ionicModal.fromTemplate(expiryModalTemplate, {
        scope,
        animation: 'slide-in-up',
      })

      scope.modal = modal
      return modal
    }

    // ------------------------------------------------------------------------
    // stateParams
    // ------------------------------------------------------------------------
    let routeId = $stateParams.routeId ? Number($stateParams.routeId) : null
    let pickupStopId = $stateParams.pickupStopId
      ? Number($stateParams.pickupStopId)
      : null
    let dropoffStopId = $stateParams.dropoffStopId
      ? Number($stateParams.dropoffStopId)
      : null

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    $scope.data = {
      pickupStop: null,
      dropoffStop: null,
      passCount: null,
      price: null,
      nextTrip: null,
      nextTripStopIds: null,
      minsBeforeClose: null,
      seatsAvailable: null,
      routeId: routeId,
      bookingEnds: null,
      routeSupportsRoutePass: null,
      isLoggedIn: null,
      boardStopInvalid: null,
      alightStopInvalid: null,
      label: null,
      hasNextTripTicket: null,
      route: null,
      company: null,
    }

    $scope.disp = {
      isBooking: false,
      ticketTitle: null,
      showHamburger: null,
      routePassExpiryModal: null,
      ticketDetailModal: null,
    }

    $scope.mapObject = {
      stops: [],
      routePath: [],
      alightStop: null,
      boardStop: null,
      pingTrips: [],
      allRecentPings: [],
      chosenStop: null,
    }

    // -------------------------------------------------------------------------
    // Ionic Events
    // -------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
      if ($ionicHistory.backView()) {
        $scope.disp.showHamburger = false
      } else {
        $scope.disp.showHamburger = true
      }
    })

    // Load the route information
    // Show a loading overlay while we wait
    // force reload when revisit the same route
    $scope.$on('$ionicView.afterEnter', () => {
      $ionicLoading.show({
        template: `<ion-spinner icon='crescent'></ion-spinner><br/><small>Loading route information</small>`,
      })

      let promises = Promise.all([
        FastCheckoutService.verify(routeId),
        RoutesService.getRoute(routeId, true),
      ])
      promises
        .then(response => {
          $scope.data.nextTrip = response[0]
          $scope.data.hasNextTripTicket = $scope.data.nextTrip.hasNextTripTicket

          if ($scope.data.hasNextTripTicket) {
            $scope.data.nextTripTicketId = $scope.data.nextTrip.nextTripTicketId
            MapService.emit('ticketIdIsAvailable', $scope.data.nextTripTicketId)
            // to inform RouteDetail to start the ping loop
            $scope.$broadcast('enteringMyBookingRoute', {
              ticketId: $scope.data.nextTripTicketId,
            })
          }
          $scope.data.nextTripStopIds = $scope.data.nextTrip.tripStops.map(
            ts => ts.stop.id
          )
          let route = response[1]
          $scope.data.route = route
          $scope.disp.routePassExpiryModal = initExpiryModal()
          CompanyService.getCompany(Number(route.transportCompanyId)).then(
            company => {
              $scope.data.company = company
            }
          )

          $scope.data.label = route.label
          $ionicLoading.hide()
          // Grab the price data
          $scope.data.price = route.trips[0].price
          // routeSupportsRoutePass
          $scope.data.routeSupportsRoutePass = FastCheckoutService.routeQualifiedForRoutePass(
            route
          )
          // Grab the stop data
          let [pickups, dropoffs] = BookingService.getStopsFromTrips(
            route.trips
          )
          pickups = new Map(pickups.map(stop => [stop.id, stop]))
          dropoffs = new Map(dropoffs.map(stop => [stop.id, stop]))
          // if pickupStop is updated from 'tabs.route-stops' state
          if (!$scope.data.pickupStop && pickupStopId) {
            $scope.data.pickupStop = pickups.get(pickupStopId)
          }
          if (!$scope.data.dropoffStop && dropoffStopId) {
            $scope.data.dropoffStop = dropoffs.get(dropoffStopId)
          }
        })
        .catch(error => {
          $ionicLoading.hide()
          $ionicPopup.alert({
            title: "Sorry there's been a problem loading the route information",
            subTitle: error,
          })
        })
    })

    // to inform ticketDetail.js to kill ping loop and deregister
    $scope.$on('$ionicView.leave', () => {
      if ($scope.data.nextTripTicketId) {
        $scope.$broadcast('leavingMyBookingRoute', {
          ticketId: $scope.data.nextTripTicketId,
        })
      }
    })

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.choosePickup = () => {
      $state.go('tabs.route-stops', {
        routeId: routeId,
        type: 'pickup',
        // stopId: $scope.data.pickupStop.id,
        stopId: pickupStopId,
        callback: stop => {
          $scope.data.pickupStop = stop
        },
      })
    }

    $scope.chooseDropoff = () => {
      $state.go('tabs.route-stops', {
        routeId: routeId,
        type: 'dropoff',
        // stopId: $scope.data.dropoffStop.id,
        stopId: dropoffStopId,
        callback: stop => {
          $scope.data.dropoffStop = stop
        },
      })
    }

    $scope.buyMore = () => {
      $state.go('tabs.purchase-route-pass', {
        routeId,
      })
    }

    $scope.popupRoutePassExpiry = () => {
      GoogleAnalytics.send('send', 'event', {
        eventCategory: 'route pass expiry',
        eventAction: 'route detail button press',
      })
      $scope.disp.routePassExpiryModal.show()
    }

    $scope.viewTicket = () => {
      $scope.disp.ticketDetailModal = initTicketModal()
      $scope.disp.ticketDetailModal.show()
      $scope.modalFunctions.recenterMap()
    }

    $scope.bookNextTrip = async () => {
      if ($scope.data.nextTrip.nextTripCancelled) {
        const response = await $ionicPopup.confirm({
          title: 'The next trip is cancelled',
          template: 'Are you sure you want to proceed?',
        })
        if (!response) return
      }
      $state.go('tabs.route-summary', {
        routeId: $scope.data.routeId,
        boardStop: $scope.data.pickupStop.id,
        alightStop: $scope.data.dropoffStop.id,
        selectedDates: [$scope.data.nextTrip.date.getTime()],
      })
    }

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    // re-verify the fastCheckout once user is logged in
    UserService.userEvents.on('userChanged', () => {
      FastCheckoutService.verify(routeId).then(response => {
        $scope.data.nextTrip = response
      })
    })

    // Get the route passes
    $scope.$watch(
      () => RoutesService.getPassCountForRoute(routeId),
      passCount => {
        $scope.data.passCount = passCount
      }
    )

    $scope.$watch(
      () => UserService.getUser(),
      user => {
        $scope.data.isLoggedIn = !!user
        if (user) {
          $scope.data.user = user
        }
      }
    )

    $scope.$watch('data.pickupStop', ps => {
      if (ps) {
        MapService.emit('board-stop-selected', { stop: ps })
        if (
          $scope.data.nextTripStopIds &&
          $scope.data.nextTripStopIds.indexOf(ps.id) === -1
        ) {
          $scope.data.boardStopInvalid = true
        } else {
          $scope.data.boardStopInvalid = false
        }
      }
    })

    $scope.$watch('data.dropoffStop', ds => {
      if (ds) {
        MapService.emit('alight-stop-selected', { stop: ds })
        if (
          $scope.data.nextTripStopIds &&
          $scope.data.nextTripStopIds.indexOf(ds.id) === -1
        ) {
          $scope.data.alightStopInvalid = true
        } else {
          $scope.data.alightStopInvalid = false
        }
      }
    })
  },
]
