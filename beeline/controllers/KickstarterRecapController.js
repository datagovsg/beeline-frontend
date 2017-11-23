import busStopListTemplate from '../templates/bus-stop-list.html'

export default [
  '$scope', '$state', '$stateParams', '$ionicModal', 'BookingService',
  'RoutesService', 'KickstarterService', 'CompanyService', 'MapOptions',
  function(
    $scope, $interpolate, $state, $stateParams, $ionicModal, BookingService,
    RoutesService, KickstarterService, CompanyService, MapOptions
  ) {
    // Default settings for various info used in the page
    $scope.book = {
      routeId: null,
      boardStopId: null,
      alightStop: null,
      route: null,
      bidPrice: null,
      boardStops: null,
      alightStops: null,
      passAvailable: null,
      creditTag: null,
    }

    $scope.book.routeId = Number($stateParams.routeId)

    $scope.book.creditTag = "crowdstart-" + $scope.book.routeId

    $scope.modalMap = MapOptions.defaultMapOptions()

    $scope.modal = $ionicModal.fromTemplate(busStopListTemplate, {
      scope: $scope,
      animation: 'slide-in-up',
    })

    $scope.showStops = function() {
      $scope.modal.show()

      $scope.$watch(() => $scope.modalMap.control.getGMap && $scope.modalMap.control.getGMap(), function(modalMap) {
        if (modalMap) {
          MapOptions.resizePreserveCenter(modalMap)
          // set modalMap bound
          $scope.panToStops(modalMap, $scope.busStops)
        }
      })
    }
    $scope.close = function() {
      $scope.modal.hide()
    }
    // Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
      $scope.modal.remove()
    })

    $scope.$watchGroup([() => KickstarterService.getCrowdstartById($scope.book.routeId),
      () => KickstarterService.getBidInfo($scope.book.routeId),
      () => RoutesService.getRoutePasses($scope.book.creditTag)],
      ([route, bid, passes]) => {
        if (!route) return
        $scope.book.route = route;
        /** Summarizes the stops from trips by comparing their stop location and time */
        [$scope.book.boardStops, $scope.book.alightStops] = BookingService.computeStops($scope.book.route.trips)
        $scope.busStops = $scope.book.boardStops.concat($scope.book.alightStops)
        if (!bid) return
        $scope.book.bid = bid
        $scope.book.bidPrice = $scope.book.bid.bidPrice
        $scope.book.boardStopId = Number($scope.book.bid.boardStopId)
        $scope.book.alightStopId = Number($scope.book.bid.alightStopId)
        $scope.book.boardStop = route.trips[0]
              .tripStops
              .find(ts => $scope.book.boardStopId === ts.stop.id)
        $scope.book.alightStop = route.trips[0]
              .tripStops
              .find(ts => $scope.book.alightStopId === ts.stop.id)
        $scope.book.passAvailable = (passes || []).length
      }
    )

    $scope.showTerms = async () => {
      if (!$scope.book.route.transportCompanyId) return
      await CompanyService.showTerms($scope.book.route.transportCompanyId)
    }

    /* Pans to the stops on the screen */
    $scope.panToStops = function(gmap, stops) {
      if (stops.length === 0) {
        return
      }
      var bounds = new google.maps.LatLngBounds()
      for (let s of stops) {
        bounds.extend(new google.maps.LatLng(
          s.coordinates.coordinates[1],
          s.coordinates.coordinates[0]
        ))
      }
      gmap.fitBounds(bounds)
    }

    // pans to single stop
    $scope.panToStop = function(gmap, stop) {
      if (!stop) return
      $scope.book.chosenStop = stop
      gmap.panTo({
        lat: stop.coordinates.coordinates[1],
        lng: stop.coordinates.coordinates[0],
      })
      gmap.setZoom(17)
    }
  },
]
