export default [
  "$scope",
  "$state",
  "$stateParams",
  "$ionicLoading",
  "$ionicPopup",
  "UserService",
  "RoutesService",
  "BookingService",
  "FastCheckoutService",
  "MapService",
  function(
    $scope,
    $state,
    $stateParams,
    $ionicLoading,
    $ionicPopup,
    UserService,
    RoutesService,
    BookingService,
    FastCheckoutService,
    MapService
  ) {
    // ------------------------------------------------------------------------
    // Input
    // ------------------------------------------------------------------------
    let routeId = $stateParams.routeId ? +$stateParams.routeId : null;
    let pickupStopId = $stateParams.pickupStopId
                         ? +$stateParams.pickupStopId
                         : null;
    let dropoffStopId = $stateParams.dropoffStopId
                          ? +$stateParams.dropoffStopId
                          : null;

    // ------------------------------------------------------------------------
    // Model
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
      hasNextTripTicket: null,
      routeId: routeId,
      bookingEnds: null,
      routeSupportsRoutePass: null,
      isLoggedIn: null,
      boardStopInvalid: null,
      alightStopInvalid: null,
    }

    $scope.disp = {
      isBooking : false
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

    // ------------------------------------------------------------------------
    // Hooks
    // ------------------------------------------------------------------------
    $scope.choosePickup = () => {
      $state.go("tabs.route-stops", {
        routeId: routeId,
        type: "pickup",
        // stopId: $scope.data.pickupStop.id,
        stopId: pickupStopId,
        callback: (stop) => {
          $scope.data.pickupStop = stop;
        }
      });
    };

    $scope.chooseDropoff = () => {
      $state.go("tabs.route-stops", {
        routeId: routeId,
        type: "dropoff",
        // stopId: $scope.data.dropoffStop.id,
        stopId: dropoffStopId,
        callback: (stop) => {
          $scope.data.dropoffStop = stop;
        }
      });
    };

    function reactivateButton () {
      $scope.disp.isBooking = false
    }

    $scope.bookNext = () => {
      $scope.disp.isBooking = true
      FastCheckoutService.fastCheckout(routeId,
        $scope.data.pickupStop.id, $scope.data.dropoffStop.id, [$scope.data.nextTrip.date.getTime()])
        .then( reactivateButton , reactivateButton)
    };

    $scope.buyMore =  () => {
      FastCheckoutService.buyMore(routeId)
    }

    // ------------------------------------------------------------------------
    // Initialization
    // ------------------------------------------------------------------------

    // Load the route information
    // Show a loading overlay while we wait
    // force reload when revisit the same route
    $scope.$on('$ionicView.afterEnter', () => {
      $ionicLoading.show({
        template: `<ion-spinner icon='crescent'></ion-spinner><br/><small>Loading route information</small>`,
        hideOnStateChange: true
      });
      var promises = Promise.all([FastCheckoutService.verify(routeId), RoutesService.getRoute(routeId)])
      promises.then((response) => {
        $scope.data.nextTrip = response[0]
        $scope.data.nextTripStopIds = $scope.data.nextTrip.tripStops.map(ts => ts.stop.id)
        var route = response[1]
        $ionicLoading.hide();
        // Grab the price data
        $scope.data.price = route.trips[0].price;
        // routeSupportsRoutePass
        $scope.data.routeSupportsRoutePass = FastCheckoutService.routeQualifiedForRoutePass(route)
        // Grab the stop data
        let [pickups, dropoffs] = BookingService.computeStops(route.trips);
        pickups = new Map(pickups.map(stop => [stop.id, stop]));
        dropoffs = new Map(dropoffs.map(stop => [stop.id, stop]));
        // if pickupStop is updated from 'tabs.route-stops' state
        if (!$scope.data.pickupStop && pickupStopId) $scope.data.pickupStop = pickups.get(pickupStopId);
        if (!$scope.data.dropoffStop && dropoffStopId) $scope.data.dropoffStop = dropoffs.get(dropoffStopId);
      }).catch(error => {
        $ionicLoading.hide();
        $ionicPopup.alert({
          title: "Sorry there's been a problem loading the route information",
          subTitle: error
        });
      });
    });


    // Get the route credits
    $scope.$watch(
      () => RoutesService.getPassCountForRoute(routeId),
      (passCount) => { $scope.data.passCount = passCount; }
    )

    // re-verify the fastCheckout once user is logged in
    UserService.userEvents.on('userChanged', () => {
      FastCheckoutService.verify(routeId).then((response) => {
        $scope.data.nextTrip = response
      })
    })

    $scope.$watch(() => UserService.getUser(), (user) => {
      $scope.data.isLoggedIn = user ? true : false
    })

    $scope.$watch('data.pickupStop', (ps) => {
      if (ps) {
        MapService.emit('board-stop-selected', {stop: ps})
        if ($scope.data.nextTripStopIds && $scope.data.nextTripStopIds.indexOf(ps.id) === -1) {
          $scope.data.boardStopInvalid = true;
        } else {
          $scope.data.boardStopInvalid = false;
        }
      }
    })

    $scope.$watch('data.dropoffStop', (ds) => {
      if (ds) {
        MapService.emit('alight-stop-selected', {stop: ds})
        if ($scope.data.nextTripStopIds && $scope.data.nextTripStopIds.indexOf(ds.id) === -1) {
          $scope.data.alightStopInvalid = true;
        } else {
          $scope.data.alightStopInvalid = false;
        }
      }
    })

  }
];
