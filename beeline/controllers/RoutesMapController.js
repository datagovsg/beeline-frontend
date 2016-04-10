import {formatHHMM_ampm} from '../shared/format';
import _ from 'lodash'

export default function($scope, $state, $ionicModal, $cordovaGeolocation,
    										uiGmapGoogleMapApi, BookingService, RoutesService){
	//Gmap default settings
	//Map configuration 
	$scope.map = {
		// Center the map on Singapore
		center: { latitude: 1.370244, longitude: 103.823315 },
		zoom: 11,
		// Bound the search autocompelte to within Singapore
		bounds: { 
			northeast: { latitude: 1.485152, longitude: 104.091837 },
			southwest: { latitude: 1.205764, longitude: 103.589899 }
		},
		// State variable which becomes true when map is being dragged
		dragging: false,
		// Object that will have the getGMap and refresh methods bound to it
		control: {},
		// Hide the default map controls and hide point of information displays
		options: {
			disableDefaultUI: true,
			styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
		},
		//empty functions - to be overwritten
		events: { 
			dragstart : function(map, eventName, args) {},
			zoom_changed : function(map, eventName, args) {},
			dragend : function(map, eventName, args) {},
			click : function(map, eventName, args) {}
		},
    markers: [],
    lines: [{
      id: 'routepath',
      path: [],
      icons: [{
        icon: { path: 1, scale: 3, strokeColor: '#333'},
        offset: '20%',
        repeat: '50px'
      }]
    }],
	};

	//HTML Elements above the Gmap are hidden at start
	$scope.data = {
		focus: 'pickupinput', //id of the input field
		pickuphide : true,
		dropoffhide: true,
		centmarkhide : true,
		locatemehide : true,
		btnnexthide : true,
		pickupText: '', //used by ng-model to display/store the txt value
		dropoffText: '',
		platlng: [],
		dlatlng: [],
		pclearhide : true,
		dclearhide : true,
		lockIdleEvent: true, //prevents the IDLE listener from firing the moment the map loads
		btnnexttxt : 'NEXT',
		readyToSubmit : false, //used to indicate when user is on final search 'screen',
		resultsModal: '', //placeholder for search results modal
		searchresults: [], //placeholders for search results
		searchkickstart: [],
		suggestTime: ''
	};

	uiGmapGoogleMapApi.then(function(googleMaps) {
		$scope.$watch('map.control.getGMap', function(){
			var gmap = $scope.map.control.getGMap();

			// Set up the text inputs
			var pickupInputElement = document.getElementById('pickupinput');
			var dropoffInputElement = document.getElementById('dropoffinput');
			// Triggers for focus. Empty placeholder functions for now
			$scope.pickupFocus = function() {};
			$scope.dropoffFocus = function() {};
			// If the text is changed clear the coordinates since they wont be valid anymore
			$scope.pickupTxtChange = function() { delete $scope.data.pickupCoordinates; };
			$scope.dropoffTxtChange = function() { delete $scope.data.pickupCoordinatesl; };
			// Buttons clear the current text, coordinates, and set the focus
			$scope.clearPickup = function() {
				$scope.data.pickupText = '';
				delete $scope.data.pickupCoordinates;
				pickupInputElement.focus();
			};
			$scope.clearDropoff = function() {
				$scope.data.dropoffText = '';
				delete $scope.data.pickupCoordinates;
				dropoffInputElement.focus();
			};
			// Attach Autocomplete Service to the input fields
			var pickupAutocompleter = new googleMaps.places.Autocomplete(pickupInputElement);
			var dropoffAutocompleter = new googleMaps.places.Autocomplete(dropoffInputElement);
			pickupAutocompleter.addListener('place_changed', function() {
				gmap.panTo(pickupAutocompleter.getPlace().geometry.location.toJSON());
				gmap.setZoom(17);
			});
			dropoffAutocompleter.addListener('place_changed', function() {
				gmap.panTo(dropoffAutocompleter.getPlace().geometry.location.toJSON());
				gmap.setZoom(17);
			});

			// Set panning to update the input text
			var geocoder = new googleMaps.Geocoder();
			$scope.map.events.dragend = function(map, eventName, args) {
				if (!$scope.data.pickupCoordinates || !$scope.data.dropoffCoordinates) {
					geocoder.geocode({latLng: gmap.getCenter()}, function(results, status) {
	          if (status === 'OK') {
	          	var locationText = results[0].formatted_address;
	          	if (!$scope.data.pickupCoordinates) { $scope.data.pickupText = locationText; } 
	          	else if (!$scope.data.dropoffCoordinates) { $scope.data.dropoffText = locationText; }
	          }
	        });
				}
			};

			// Configure the UI in accordance with the users set/unset coordinates
			$scope.$watchGroup(['data.pickupCoordinates', 'data.dropoffCoordinates'], function() {

	      // Configure the next button text according to what has been set
	      if (!$scope.data.pickupCoordinates) {
	      	$scope.data.btnnexttxt = "Set Pickup";
	      	$scope.nextBtnClick	= function() {
						$scope.data.pickupCoordinates = gmap.getCenter().toJSON();
	      	};
	      } 
	      else if ($scope.data.pickupCoordinates && 
	               !$scope.data.dropoffCoordinates) {
	      	$scope.data.btnnexttxt = "Set Dropoff";
	      	$scope.nextBtnClick	= function() {
						$scope.data.dropoffCoordinates = gmap.getCenter().toJSON();
	      	};
	      } 
	      else if ($scope.data.pickupCoordinates && 
	               $scope.data.dropoffCoordinates) {
	      	$scope.data.btnnexttxt = "Search For Routes";
	      	$scope.nextBtnClick	= function() {
		      	console.log("both set and ready for liftoff");
		      	// TODO actually do something here
	      	};
	      }

				// Draw the pickup & dropoff markers if we have coordinates 
				$scope.map.markers = [];
	      if ($scope.data.pickupCoordinates) {
	      	$scope.map.markers.push({
		        id: 'pickup',
		        latitude: $scope.data.pickupCoordinates.lat,
		        longitude: $scope.data.pickupCoordinates.lng,
		        title: 'pickupMarker',
		        icon: {
		          url: './img/icon-marker-big.png',
		          size: new googleMaps.Size(49, 59),
		          origin: new googleMaps.Point(0,0),
		          anchor: new googleMaps.Point(14, 34),
		          scaledSize: new googleMaps.Size(28.125, 33.86)
		        }
		      });
	      }
	      if ($scope.data.dropoffCoordinates) {
	      	$scope.map.markers.push({
		        id: 'dropoff',
		        latitude: $scope.data.dropoffCoordinates.lat,
		        longitude: $scope.data.dropoffCoordinates.lng,
		        title: 'dropoffMarker',
		        icon: {
		          url: './img/icon-marker-big.png',
		          size: new googleMaps.Size(49, 59),
		          origin: new googleMaps.Point(0,0),
		          anchor: new googleMaps.Point(14, 34),
		          scaledSize: new googleMaps.Size(28.125, 33.86)
		        }
		      });
	      }

			});


		});
	});
};
