'use strict';

import {NetworkError} from '../shared/errors'
import {formatDate, formatTime, formatUTCDate,formatHHMM_ampm} from '../shared/format'

export default [
  '$rootScope',
  '$scope',
  '$state',
  '$stateParams',
  '$ionicModal',
  '$http',
  '$cordovaGeolocation',
  'BookingService',
  'uiGmapGoogleMapApi',
  function(
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $ionicModal,
    $http,
    $cordovaGeolocation,
    BookingService,
    uiGmapGoogleMapApi
  ) {
  	//Gmap default settings
  	$scope.map = {
  		center: { latitude: 1.370244, longitude: 103.823315 },
  		zoom: 11,
  		bounds: { //so that autocomplete will mainly search within Singapore
  			northeast: {
  				latitude: 1.485152,
  				longitude: 104.091837
  			},
  			southwest: {
  				latitude: 1.205764,
  				longitude: 103.589899
  			}
  		},
  		mapControl: {},
  		options: {
  			disableDefaultUI: true,
  			styles: [{
  				featureType: "poi",
  				stylers: [{
  					visibility: "off"
  				}]
  			}],
  			draggable: true
  		},
  		markers: [],
  		lines: [],
  	};

    var resolveGmap = null;
    var gmapIsReady = new Promise((resolve, reject) => {
      resolveGmap = resolve;
    });
    $scope.mapReady = function() {
      resolveGmap();
    }

  	//Default settings for various info used in the page
  	$scope.book = {
  		routeid: '',
  		boardStops: [],
  		alightStops: [],
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
  		errmsg: ''
  	}

    // Name when controller was fired??
    // Maybe find a neater solution?
    var stateName = $state.current.name;
    $scope.BookingService = BookingService;

    // State change
    if ($state.is('tabs.booking')) {
      if (BookingService.currentBooking && BookingService.lastState) {
        $state.go(BookingService.lastState);
      }
      else {
        $state.go('tabs.booking-pickup');
      }
    }
    $scope.updateState = function(state) {
        $scope.BookingService.lastState = $scope.state = state.name;
    }
    $scope.updateState($state.current);
    $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
        $scope.updateState(toState);
        if (stateName == toState.name) {
            window.setStop = $scope.setStop;
            console.log('Revised ' + stateName);
        }
    });

      $scope.setStop = function () {
          var stop = $scope.infoStop;
          var type = $scope.infoType;
          console.log(type);
          console.log(stop);
          $scope.$apply(() => {
              if (type == 'board') {
                  $scope.BookingService.currentBooking.boardStop = stop.id;
              }
              else {
                  $scope.BookingService.currentBooking.alightStop = stop.id;
              }

              /* Hide the infowindow */
              $scope.infoStop = null;
              $scope.infoType = null;
          });
      };

      // Subcomponents, views etc
      $scope.$on('$destroy', () => {
          if ($scope.changesModal) {
              $scope.changesModal.remove();
          }
      });

      // FIXME: Use uiGmapIsReady, but that is so buggy WTF.
      async function resizeMap() {
        await gmapIsReady;
  	    $scope.displayRouteInfo();
        google.maps.event.trigger($scope.map.mapControl.getGMap(), 'resize');
      }
      $scope.$on('$ionicView.afterEnter', resizeMap);

      // Properties
      $scope.bookingStep = $stateParams.step;
      if (!$scope.BookingService.currentBooking) {
          $scope.BookingService.currentBooking = {
              boardStop: undefined,
              alightStop: undefined,
              qty: 1,
              trips: null,
          };
      }

      $scope.title = $scope.state == 'tabs.booking-pickup' ?
          'Select Pick-up and Drop-off Points' :
          'Select Drop-off Point';
      $scope.routePath = [];

      $scope.getStopId = (stop) => stop.id;
      $scope.getStopDescription = (stop) => stop.description;

      $scope.boardMarkerOptions = {};
      $scope.alightMarkerOptions = {};

      uiGmapGoogleMapApi.then(() => {
  		setTimeout(function(){
  			//Disable the Google link at the bottom left of the map
  			var glink = angular.element(document.getElementsByClassName("gm-style-cc"));
  			glink.next().find('a').on('click', function (e) {
  				e.preventDefault();
  			});
  		}, 300);

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
    })

  	//Load the data for the selected route
  	$scope.displayRouteInfo = function() {
  		if ($scope.BookingService.routeInfo == null ||
  			$scope.BookingService.routeInfo.id != $scope.BookingService.id) {
  			$scope.BookingService.loadRouteInfo($http)
  			.then(() => {
  				$scope.routePath = BookingService.routeInfo.path.map(latlng => ({
  					latitude: latlng.lat,
  					longitude: latlng.lng,
  				}));

  				$scope.computeStops();
  				$scope.panToStops();

  				//console.log(BookingService);

  				//Generate list of changes for modal
  				if ($scope.state.indexOf('pickup') != -1 &&
  					(BookingService.routeInfo.priceChanges.length > 0 ||
  					BookingService.routeInfo.stopChanges.length > 0 ||
  					BookingService.routeInfo.timeChanges.length > 0)) {

  					console.log('Changes detected: diplaying message box');

  					if ($scope.changesModal) {
  						$scope.changesModal.remove();
  						$scope.changesModal = null;
  					}

  					$ionicModal.fromTemplateUrl('changes-message.html', {
  						scope: $scope,
  						animation: 'slide-in-up',
  					})
  					.then(modal => {
  						$scope.changesModal = modal;
  						$scope.changesModal.show();
  					});
  				}

  				//Fill the box at the top with Start and End info
  				var stops = BookingService.routeInfo.trips[0].tripStops,
                      regions = BookingService.routeInfo.regions,
  					start = stops[0],
  					end = stops[stops.length-1],
  					sd = new Date(start.time),
  					ed = new Date(end.time),
  					transco = BookingService.routeInfo.trips[0].transportCompanyId;

  				$scope.book.routeid = BookingService.routeId;
  				$scope.book.stime = formatHHMM_ampm(sd);
  				$scope.book.etime = formatHHMM_ampm(ed);
  				$scope.book.sroad = regions[0].name;
                  $scope.book.eroad = regions[1].name;

  				//Fill in the transport company info
  				$scope.BookingService.loadTranscoInfo($http, transco).then(function(result){

  					var tdata = {
  						id: result.id,
  						email: result.email,
  						logo: result.logo,
  						name: result.name,
  						terms: result.terms
  					}

  					$scope.book.transco = tdata;
  				});

  			})
  			.then(null, err => console.log(err.stack));
  		}
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

  			var gmap = $scope.map.mapControl.getGMap();

  			gmap.panTo(new google.maps.LatLng(userpos.coords.latitude, userpos.coords.longitude));
  			setTimeout(function(){
  				gmap.setZoom(17);
  			}, 300);

  		}, function(err){
  			console.log('ERROR - ' + err);
  		});
  	}

    $scope.computeStops = function() {
      var boardStopsObj = {};
      var alightStopsObj = {};

      for (let trip of $scope.BookingService.routeInfo.trips) {
        for (let tripStop of trip.tripStops) {
          if (tripStop.canBoard &&
                !(tripStop.stop.id in boardStopsObj)) {
            boardStopsObj[tripStop.stop.id] = tripStop.stop;

            // populate the time too... we don't know
            // whether the time stays constant so
            // just put the FIRST time
            boardStopsObj[tripStop.stop.id].time =
              formatTime(tripStop.time);
          }
          if (tripStop.canAlight &&
                !(tripStop.stop.id in alightStopsObj)) {
            alightStopsObj[tripStop.stop.id] = tripStop.stop;
            alightStopsObj[tripStop.stop.id].time =
              formatTime(tripStop.time);
          }
        }
      }

      $scope.book.boardStops = Object.keys(boardStopsObj)
          .map(key => boardStopsObj[key]);
      $scope.book.alightStops = Object.keys(alightStopsObj)
          .map(key => alightStopsObj[key]);

      //console.log($scope.book.boardStops);
      //console.log($scope.book.alightStops);
    };

    $scope.panToStops = async function () {
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
      $scope.map.mapControl.getGMap().fitBounds(bounds);
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
        'BookingService.currentBooking.boardStop',
        'BookingService.currentBooking.alightStop',
        'book.termsChecked',
      ], function () {
    		if ($scope.book.termsChecked == true) {
    			$scope.book.errmsg = '';
    			var curr = BookingService.currentBooking;

    			if (typeof(curr.boardStop) == 'undefined')
    				$scope.book.errmsg = 'Please specify a Boarding Stop.'
    			else if (typeof(curr.alightStop) == 'undefined')
    				$scope.book.errmsg = 'Please specify a Alighting Stop.'
    			else
    			{
    				$scope.book.errmsg = ''
    				$scope.book.allDataNotFilled = false;
    			}
    		}
    	});

    $scope.goToDatepicker = function() {
      if (BookingService.currentBooking.boardStop && BookingService.currentBooking.alightStop) {
        $state.go('tabs.booking-dates');
      }
    };

    console.log('Revised(2) ' + stateName);
  }
];
