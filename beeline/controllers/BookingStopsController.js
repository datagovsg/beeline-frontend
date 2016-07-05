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
    $scope.map = MapOptions.defaultMapOptions();

    // Default settings for various info used in the page
    $scope.book = {
      routeId: '',
      route: null,
      boardStops: [], // all board stops for this route
      alightStops: [], // all alight stops for this route
      boardStop: null,
      alightStop: null,
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

    var routePromise;
    $scope.$on('$ionicView.beforeEnter', () => {
      $scope.book.routeId = $stateParams.routeId;
      window.setStop = $scope.setStop;

      var stopOptions = {
        initialBoardStopId: $stateParams.boardStop ? parseInt($stateParams.boardStop) : undefined,
        initialAlightStopId: $stateParams.alightStop ? parseInt($stateParams.alightStop) : undefined,
      };

      routePromise = RoutesService.getRoute(parseInt($scope.book.routeId));

      routePromise.then((route) => {
        $scope.book.route = route;
        computeStops(stopOptions);
      });
    });

    $scope.$on('$ionicView.afterEnter', () => {
      loadingSpinner(Promise.all([gmapIsReady, routePromise])
      .then(() => {
        var gmap = $scope.map.control.getGMap();
        google.maps.event.trigger(gmap, 'resize');
        panToStops();
        showChanges();
      }));
    });

    gmapIsReady.then(function() {
      initializeMapOptions();
      MapOptions.disableMapLinks();
      $scope.routePath = [];
    });

    $scope.$watch('book.route.path', (path) => {
      if (!path) {
        $scope.routePath = [];
      }
      else {
        RoutesService.decodeRoutePath(path)
        .then((decodedPath) => $scope.routePath = decodedPath);
      }
    })

    /* Sets up the event handlers for the locate me button,
       and the buttons within the info windows */
    function initializeMapOptions() {
      // Currently these functions cannot be used
      // because data-tap-disabled="true" messes up the markers'
      // response to taps
      $scope.setStop = function() {
        var stop = $scope.infoStop;
        var type = $scope.infoType;

        $scope.$apply(() => {
          if (type == 'board') {
            $scope.book.boardStop = stop;
          }
          else {
            $scope.book.alightStop = stop;
          }
          /* Hide the infowindow */
          $scope.infoStop = null;
          $scope.infoType = null;
        });
      };
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
    /* Pans to the stops on the screen */
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

    /* Show the list of changes for the route. Don't display
      if previously displayed */
    var lastDisplayedRouteId = null;
    function showChanges() {
      $scope.$on('$destroy', () => {
        if ($scope.changesModal) {
          $scope.changesModal.remove();
        }
      });

      // 3. Check if we should display changes
      if (lastDisplayedRouteId != $scope.book.routeId) {
        var changes = BookingService.computeChanges($scope.book.route);
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
      lastDisplayedRouteId = $scope.book.routeId;
    }

    /** Summarizes the stops from trips by comparing their stop location and time */
    function computeStops({initialBoardStopId, initialAlightStopId}) {
      var trips = $scope.book.route.trips;
      var [boardStops, alightStops] = BookingService.computeStops(trips);
      $scope.book.boardStops = boardStops;
      $scope.book.alightStops = alightStops;

      // Check that the boardStopIds are still valid
      if (typeof(initialBoardStopId) === 'number') {
        $scope.book.boardStop = boardStops.find(ts =>
            ts.id === initialBoardStopId);
      }
      // Check that the boardStopIds are still valid
      if (typeof(initialAlightStopId) === 'number') {
        $scope.book.alightStop = alightStops.find(ts =>
            ts.id === initialAlightStopId);
      }

      if (boardStops.length == 1) {
        $scope.book.boardStop = boardStops[0];
      }
      if (alightStops.length == 1) {
        $scope.book.alightStop = alightStops[0];
      }
    }
  }
];
