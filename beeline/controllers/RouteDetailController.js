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
  "SharedVariableService",
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
    SharedVariableService
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
      minsBeforeClose: null,
      seatsAvailable: null,
      hasNextTripTicket: null,
      routeId: routeId,
      bookingEnds: null,
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

    $scope.bookNext = async () => {
      $scope.disp.isBooking = true
      FastCheckoutService.fastCheckout(routeId,
        $scope.data.pickupStop.id, $scope.data.dropoffStop.id, [$scope.data.nextTrip.date.getTime()])
        .then( reactivateButton , reactivateButton)
    };

    // ------------------------------------------------------------------------
    // Initialization
    // ------------------------------------------------------------------------

    // Load the route information
    // Show a loading overlay while we wait
    // force reload when revisit the same route
    $scope.$on('$ionicView.afterEnter', () => {
      // to plot the map
      SharedVariableService.set($scope.mapObject)
      $ionicLoading.show({
        template: `<ion-spinner icon='crescent'></ion-spinner><br/><small>Loading route information</small>`,
        hideOnStateChange: true
      });
      var promises = Promise.all([FastCheckoutService.verify(routeId), RoutesService.getRoute(routeId)])
      promises.then((response) => {
        $scope.data.nextTrip = response[0]
        var route = response[1]
        $ionicLoading.hide();
        // Grab the price data
        $scope.data.price = route.trips[0].price;
        // Grab the stop data
        let [pickups, dropoffs] = BookingService.computeStops(route.trips);
        $scope.mapObject.stops = pickups.concat(dropoffs);
        SharedVariableService.setStops($scope.mapObject.stops)
        if (route.path) {
          RoutesService.decodeRoutePath(route.path)
            .then((decodedPath) => {
              $scope.mapObject.routePath = decodedPath
              SharedVariableService.setRoutePath(decodedPath)
            })
            .catch(() => {
              $scope.mapObject.routePath = []
              SharedVariableService.setRoutePath([])
            })
        }
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

    $scope.$watch('data.pickupStop', (ps) => {
      if (ps) {
        SharedVariableService.setBoardStop({stop: ps});
        $scope.mapObject.boardStop = {stop: ps}
      }
    })

    $scope.$watch('data.dropoffStop', (ds) => {
      if (ds) {
        SharedVariableService.setAlightStop({stop: ds});
        $scope.mapObject.alightStop = {stop: ds}
      }
    })

  }
];
