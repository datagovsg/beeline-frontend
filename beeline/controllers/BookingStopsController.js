import {NetworkError} from '../shared/errors';
import {formatDate, formatTime, formatUTCDate, formatHHMM_ampm} from '../shared/format';

export default [
  '$rootScope',
  '$scope',
  '$interpolate',
  '$state',
  '$stateParams',
  '$ionicModal',
  '$http',
  '$cordovaGeolocation',
  'BookingService',
  'RoutesService',
  'uiGmapGoogleMapApi',
  'MapOptions',
  'loadingSpinner',
  function(
    $rootScope,
    $scope,
    $interpolate,
    $state,
    $stateParams,
    $ionicModal,
    $http,
    $cordovaGeolocation,
    BookingService,
    RoutesService,
    uiGmapGoogleMapApi,
    MapOptions,
    loadingSpinner
  ) {
    // Gmap default settings
    $scope.map = MapOptions.defaultMapOptions({
      uiOptions: {
        routePathStroke: {
          color: '#4b3863',
          weight: 3.0,
        }
      }
    });

    // Default settings for various info used in the page
    $scope.book = {
      routeId: '',
      route: null,
      boardStops: [], // all board stops for this route
      alightStops: [], // all alight stops for this route
      boardStop: null,
      alightStop: null,
      alightStopId: undefined,
      boardStopId: undefined,
      changes: {},
    };


    // Resolved when the map is initialized
    var gmapIsReady = new Promise((resolve, reject) => {
      var resolved = false;
      $scope.$watch('map.control.getGMap', function() {
        if ($scope.map.control.getGMap) {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        }
      });
    });

    $scope.$on('$ionicView.afterEnter', () => {
      $scope.book.routeId = $stateParams.routeId;
      if ($stateParams.boardStop) {
        $scope.book.boardStopId = parseInt($stateParams.boardStop);
      }
      if ($stateParams.alightStop) {
        $scope.book.alightStopId = parseInt($stateParams.alightStop);
      }
      window.setStop = $scope.setStop;

      loadingSpinner(gmapIsReady.then(() => {
        var gmap = $scope.map.control.getGMap();
        google.maps.event.trigger(gmap, 'resize');
        return $scope.displayRouteInfo(); // hide the spinner only after routes are processed
      }));
    });

    function initializeMapOptions() {
      // Click function for User Position Icon
      $scope.getUserLocation = MapOptions.locateMe($scope.map.control);

      // Currently these functions cannot be used
      // because data-tap-disabled="true" messes up the markers'
      // response to taps
      $scope.tapBoard = function(board) {
      // nconsole.log($state);
        window.setStop = $scope.setStop;
        $scope.infoStop = board;
        $scope.infoType = 'board';
      };
      $scope.tapAlight = function(alight) {
        window.setStop = $scope.setStop;
        $scope.infoStop = alight;
        $scope.infoType = 'alight';
      };
      $scope.applyTapAlight = (marker, event, model) => {
        $scope.$apply(() => $scope.tapAlight(model))
      };
      $scope.applyTapBoard = (marker, event, model) => {
        $scope.$apply(() => $scope.tapBoard(model))
      };
    }
    function initializeStopSelectorOptions() {
      /* These functions teach the <bus-stop-selector> how
       to display the stop id and description */
      $scope.getStopId = (stop) => stop.id;
      $scope.getStopDescription = (stop) =>
      formatTime(stop.time) + ' \u00a0\u00a0' + stop.description;
      $scope.getStopDescription2 = (stop) => stop.road;
    }
    function panToStops() {
      var stops = [];
      stops = $scope.book.boardStops.concat($scope.book.alightStops);

      if (stops.length == 0) {
        return;
      }
      var bounds = new google.maps.LatLngBounds();
      for (let s of stops) {
        bounds.extend(new google.maps.LatLng(
          s.coordinates.coordinates[1],
          s.coordinates.coordinates[0]
        ));
      }
      $scope.map.control.getGMap().fitBounds(bounds);
    }

    gmapIsReady.then(function() {
      var gmap = $scope.map.control.getGMap();

      initializeMapOptions();
      MapOptions.disableMapLinks();
      initializeStopSelectorOptions();

      $scope.routePath = [];

      $scope.$on('$destroy', () => {
        if ($scope.changesModal) {
          $scope.changesModal.remove();
        }
      });

      $scope.setStop = function() {
        var stop = $scope.infoStop;
        var type = $scope.infoType;

        $scope.$apply(() => {
          if (type == 'board') {
            $scope.book.boardStopId = stop.id;
          }
          else {
            $scope.book.alightStopId = stop.id;
          }
          /* Hide the infowindow */
          $scope.infoStop = null;
          $scope.infoType = null;
        });
      };

      /* ----- Methods ----- */

      // FIXME: start/end marker on selected stops

      // Load the data for the selected route
      // Which data?
      // 1. Route info
      // 2. Changes to route
      $scope.lastDisplayedRouteId = null; // works if caching
      $scope.displayRouteInfo = function() {
        return RoutesService.getRoute(parseInt($scope.book.routeId))
        .then((route) => {
          $scope.book.route = route;
          computeStops();
          panToStops();

          // 3. Check if we should display changes
          if ($scope.lastDisplayedRouteId != $scope.book.routeId) {
            var changes = BookingService.computeChanges(route);
            $scope.book.changes = changes;

            if (changes.priceChanges.length == 0 &&
                changes.stopChanges.length == 0 &&
                changes.timeChanges.length == 0) {
                return;
              }

            // FIXME: We are hiding this for now, until
            // we get the UI right. We should be pulling
            // the announcements from RouteAnnouncements instead

            // if ($scope.changesModal) {
            //     $scope.changesModal.show();
            //   }
            // else {
            //   $ionicModal.fromTemplateUrl('changes-message.html', {
            //     scope: $scope,
            //     animation: 'slide-in-up',
            //   })
            //   .then(modal => {
            //     $scope.changesModal = modal;
            //     $scope.changesModal.show();
            //
            //     $scope.closeChangesModal = function() {
            //       $scope.changesModal.hide();
            //     };
            //   });
            // }
          }
          $scope.lastDisplayedRouteId = $scope.book.routeId;
        })
        .then(null, err => console.log(err.stack));
      };

      /** Summarizes the stops from trips by comparing their stop location and time */
      function computeStops() {
        var trips = $scope.book.route.trips;
        var [boardStops, alightStops] = BookingService.computeStops(trips);
        $scope.book.boardStops = boardStops;
        $scope.book.alightStops = alightStops;

        // Check that the boardStopIds are still valid
        if (typeof($scope.book.boardStopId) === 'number') {
          if (!boardStops.find(ts => ts.id === $scope.book.boardStopId)) {
            $scope.book.boardStopId = undefined;
          }
        }
        // Check that the boardStopIds are still valid
        if (typeof($scope.book.alightStopId) === 'number') {
          if (!alightStops.find(ts => ts.id === $scope.book.alightStopId)) {
            $scope.book.alightStopId = undefined;
          }
        }

        if (boardStops.length == 1) {
          $scope.book.boardStopId = boardStops[0].id;
        }
        if (alightStops.length == 1) {
          $scope.book.alightStopId = alightStops[0].id;
        }
      }
    });

    // Extract the coordinates of the selected stops
    $scope.$watch(
      () => [
        $scope.book.boardStopId,
        $scope.book.boardStops && $scope.book.boardStops.map(bs => bs.id)
      ],
      () => {
        var stopId = $scope.book.boardStopId;
        var stops = $scope.book.boardStops;

        if (!stopId || !stops) return;
        $scope.book.boardStop = stopId ?
          stops.find(x => x.id == stopId)
          : null;
      }, true)
    $scope.$watch(
      () => [
        $scope.book.alightStopId,
        $scope.book.alightStops && $scope.book.alightStops.map(bs => bs.id)
      ],
      () => {
        var stopId = $scope.book.alightStopId;
        var stops = $scope.book.alightStops;

        if (!stopId || !stops) return;
        $scope.book.alightStop = stopId ?
          stops.find(x => x.id == stopId)
          : null;
      }, true);
    $scope.$watch('book.route.path', (path) => {
      if (!path) {
        $scope.routePath = [];
      }
      else {
        RoutesService.decodeRoutePath(path)
        .then((decodedPath) => $scope.routePath = decodedPath);
      }
    })
  }
];
