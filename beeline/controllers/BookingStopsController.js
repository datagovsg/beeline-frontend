import {NetworkError} from '../shared/errors'
import {formatDate, formatTime, formatUTCDate,formatHHMM_ampm} from '../shared/format'

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
  'CompanyService',
  'uiGmapGoogleMapApi',
  'MapOptions',
  '$timeout',
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
    CompanyService,
    uiGmapGoogleMapApi,
    MapOptions,
    $timeout
  ) {
    //Gmap default settings
    $scope.map = MapOptions.defaultMapOptions();

    //Default settings for various info used in the page
    $scope.book = {
      routeId: '',
      route: null,
      boardStops: [], //all board stops for this route
      alightStops: [], //all alight stops for this route
      boardStop: undefined,
      alightStop: undefined,
      stime: '',
      etime: '',
      sroad: '',
      eroad: '',
      stxt: 'Select your pick-up stop',
      etxt: 'Select your drop-off stop',
      ptxt: 'No. of passengers',
      transco: {},
      allDataNotFilled: true,
      termsChecked: false,
      errmsg: '',
      changes: {},
      company: {},
      qty: ''
    };

    // @hongyi
    // if $ionicView.afterEnter is set from
    // within uiGmapGoogleMapApi.then(() => {}) and the map api
    // resolves AFTER the page enters, the afterEnter event will
    // never be fired.
    //
    // So afterEnter is set from within the main scope function
    // However, it must then wait for the map to be ready.'
    // Hence this promise.
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
    })

    $scope.$on('$ionicView.afterEnter', () => {
      $scope.book.routeId = $stateParams.routeId;
      $scope.book.boardStop  = parseInt($stateParams.boardStop);
      $scope.book.alightStop = parseInt($stateParams.alightStop);
      window.setStop = $scope.setStop;
      gmapIsReady.then(() => {
        var gmap = $scope.map.control.getGMap();
        google.maps.event.trigger(gmap, 'resize');
        $scope.displayRouteInfo();
      })
    });

    gmapIsReady.then(function() {
      var gmap = $scope.map.control.getGMap();
      $scope.alightMarkerOptions = {
        icon: {
          url: 'img/alight.png',
          scaledSize: new google.maps.Size(20,20),
          anchor: new google.maps.Point(5,5),
        },
      };

      $scope.boardMarkerOptions = {
        icon: {
          url: 'img/board.png',
          scaledSize: new google.maps.Size(20,20),
          anchor: new google.maps.Point(5,5),
        },
      };
      var timer;
      timer = $timeout(function(){
        //Disable the Google link at the bottom left of the map
        var glink = angular.element(document.getElementsByClassName("gm-style-cc"));
        glink.next().find('a').on('click', function (e) {
          e.preventDefault();
        });
      }, 300);

      $scope.routePath = [];

      $scope.$on('$destroy', () => {
        if ($scope.changesModal) {
          $scope.changesModal.remove();
        }
        if (timer){
          $timeout.cancel(timer);
        }
    });

    $scope.setStop = function () {
      var stop = $scope.infoStop;
      var type = $scope.infoType

      $scope.$apply(() => {
        if (type == 'board') {
            $scope.book.boardStop = stop.id;
        }
        else {
            $scope.book.alightStop = stop.id;
        }
        /* Hide the infowindow */
        $scope.infoStop = null;
        $scope.infoType = null;
      });
    };

    /* These function teaches the <bus-stop-selector> how
     to display the stop id and description */
    $scope.getStopId = (stop) => stop.id;
    $scope.getStopDescription = (stop) =>
      formatTime(stop.time) + ' \u00a0\u00a0' + stop.description;
    $scope.getStopDescription2 = (stop) =>
      stop.road;

    // FIXME: start/end marker on selected stops

    // Load the data for the selected route
    // Which data?
    // 1. Route info
    // 2. Company info
    // 3. Changes to route
    $scope.lastDisplayedRouteId = null; // works if caching
    $scope.displayRouteInfo = function() {
        RoutesService.getRoute($scope.book.routeId)
      .then((route) => {
        // 1. Route info
        $scope.routePath = route.path.map(latlng => ({
          latitude: latlng.lat,
          longitude: latlng.lng,
        }));
          $scope.book.route = route;
          console.log($scope.book.route);
        computeStops();
        panToStops();

        // 3. Check if we should display changes
          if ($scope.lastDisplayedRouteId != $scope.book.routeId) {
          var changes = BookingService.computeChanges(route);
            $scope.book.changes = changes;
            console.log(changes);

          if (changes.priceChanges.length == 0 &&
              changes.stopChanges.length == 0 &&
              changes.timeChanges.length == 0) {
            return
          }

          console.log('Changes detected: diplaying message box');

          if ($scope.changesModal) {
            $scope.changesModal.remove();
            $scope.changesModal = null;
          }

          if ($scope.changesModal) {
            $scope.changesModal.show();
          }
          else {
            $ionicModal.fromTemplateUrl('changes-message.html', {
              scope: $scope,
              animation: 'slide-in-up',
            })
            .then(modal => {
              $scope.changesModal = modal;
              $scope.changesModal.show();
            });
          }
        }
          $scope.lastDisplayedRouteId = $scope.book.routeId;

        // 2. Fill in the transport company info
        return CompanyService.getCompany(route.trips[0].transportCompanyId)
        .then(function(result){
            $scope.book.company = result;
        });
      })
      .then(null, err => console.log(err.stack));
    };

    $scope.closeChangesModal = function() {
      $scope.changesModal.hide();
    }

    /* ----- Methods ----- */
    //Click function for User Position Icon
    $scope.getUserLocation = function() {
      var options = {
        timeout: 5000,
        enableHighAccuracy: true
      };

      //promise
      $cordovaGeolocation
      .getCurrentPosition({ timeout: 5000, enableHighAccuracy: true })
      .then(function(userpos){

        gmap.panTo(new google.maps.LatLng(userpos.coords.latitude, userpos.coords.longitude));
        setTimeout(function(){
          gmap.setZoom(17);
        }, 300);

      }, function(err){
        console.log('ERROR - ' + err);
      });
    }

    function computeStops() {
        var trips = $scope.book.route.trips;
        var stops = BookingService.computeStops(trips);
        $scope.book.boardStops = stops[0];
        $scope.book.alightStops = stops[1];
      };

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
    };

    $scope.tapBoard = function (board) {
      // nconsole.log($state);
      window.setStop = $scope.setStop;
      $scope.infoStop = board;
      $scope.infoType = 'board';
    };
    $scope.tapAlight = function (alight) {
      window.setStop = $scope.setStop;
      $scope.infoStop = alight;
      $scope.infoType = 'alight';
    };
    $scope.applyTapAlight = (x) => $scope.$apply(() => $scope.tapAlight(x));
    $scope.applyTapBoard = (x) => $scope.$apply(() => $scope.tapBoard(x));

    //Check whether:
    //[1] Start stop is specified
    //[2] End stop is specified
    //[3] Checkbox is checked
    $scope.$watchGroup([
        'book.boardStop',
        'book.alightStop',
        'book.termsChecked',
      ], function () {
        if ($scope.book.termsChecked == true) {
          $scope.book.errmsg = '';
            var curr = $scope.book;

          if (typeof(curr.boardStop) == 'undefined')
            $scope.book.errmsg = 'Please specify a Boarding Stop.'
          else if (typeof(curr.alightStop) == 'undefined')
            $scope.book.errmsg = 'Please specify a Alighting Stop.'
          else
          {
              $scope.book.errmsg = '';
            $scope.book.allDataNotFilled = false;
          }
        }
      });
    });
  }
];
