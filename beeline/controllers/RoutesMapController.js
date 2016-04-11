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
		centerMarkIsVisible: true,
		locateMeIsVisible: true,
		nextButtonIsVisible: true
	};

	uiGmapGoogleMapApi.then(function(googleMaps) {
		$scope.$watch('map.control.getGMap', function(){

			var gmap = $scope.map.control.getGMap();
			var pickupInputElement = document.getElementById('pickupinput');
			var dropoffInputElement = document.getElementById('dropoffinput');

			// Hide uneccessary UI elements when typing in the text inputs
			$scope.pickupFocus = $scope.dropoffFocus = function() {
				$scope.data.locateMeIsVisible = false;
				$scope.data.nextButtonIsVisible = false;
			};
			$scope.pickupBlur = $scope.dropoffBlur = function() {
				$scope.data.locateMeIsVisible = true;
				$scope.data.nextButtonIsVisible = true;
			};
			
			// If the text is changed clear the coordinates since they wont be valid anymore
			$scope.pickupTxtChange = function() { delete $scope.data.pickupCoordinates; };
			$scope.dropoffTxtChange = function() { delete $scope.data.dropoffCoordinates; };

			// Buttons clear the current text, coordinates, and set the focus
			$scope.clearPickup = function() {
				$scope.data.pickupText = '';
				delete $scope.data.pickupCoordinates;
			};
			$scope.clearDropoff = function() {
				$scope.data.dropoffText = '';
				delete $scope.data.dropoffCoordinates;
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

			// Configure the set my user location button
			$scope.getUserLocation = function() {
		    $cordovaGeolocation
		    .getCurrentPosition({ timeout: 5000, enableHighAccuracy: true })
		    .then(function(userPosition){
		      gmap.panTo(new google.maps.LatLng(userPosition.coords.latitude, userPosition.coords.longitude));
	        gmap.setZoom(17);
		    });
		  };

		  // TODO refactor this into a separate view
		  //Redirect to Route Details
		  $scope.showRouteDetails = function(item) {
		    //close the modal
		    $scope.data.resultsModal.hide();
		    //redirect to Routes Details
        BookingService.routeId = item.id;
		    $state.go('tabs.booking-pickup');
		  };
		  // Set up the results modal
		  $scope.data.resultsModal = $ionicModal.fromTemplate(require('./searchResults.html'), {
		    scope: $scope,
		    animation: 'slide-in-up'
		  });

			// Configure the UI in accordance with the users set/unset coordinates
			$scope.$watchGroup(['data.pickupCoordinates', 'data.dropoffCoordinates'], function() {

	      // Configure the next button text according to what has been set
	      if (!$scope.data.pickupCoordinates) {
	      	$scope.data.nextActionName = "Set Pickup";
	      	$scope.nextAction	= function() {
						$scope.data.pickupCoordinates = gmap.getCenter().toJSON();
	      	};
	      } 
	      else if ($scope.data.pickupCoordinates && 
	               !$scope.data.dropoffCoordinates) {
	      	$scope.data.nextActionName = "Set Dropoff";
	      	$scope.nextAction	= function() {
						$scope.data.dropoffCoordinates = gmap.getCenter().toJSON();
	      	};
	      } 
	      else if ($scope.data.pickupCoordinates && 
	               $scope.data.dropoffCoordinates) {
	      	$scope.data.nextActionName = "Search For Routes";
	      	$scope.nextAction	= function() {

		      	////////////////////////////////////////////////////////////////////
		      	// Show the search results
		      	// TODO replace with a state change to a results view
		      	////////////////////////////////////////////////////////////////////
		        //place the start and end locations' latlng into the Search object
		        RoutesService.addReqData($scope.data.pickupText,
								                     $scope.data.dropoffText,
								                     $scope.data.pickupCoordinates.lat,
								                     $scope.data.pickupCoordinates.lng,
								                     $scope.data.dropoffCoordinates.lat,
								                     $scope.data.dropoffCoordinates.lng);
		        RoutesService.getclosestroute().then(
		        	function(result){
					      console.log('Retrieved search results');
					      //store a copy of the search results in the Search object
					      RoutesService.setresults(result.data);
					      //sift through the data to get the values we need
					      $scope.data.searchresults = [];
					      for(var i=0; i<result.data.length; i++) {
					        var e = result.data[i];
					        var sstop = e.nearestBoardStop;
					        var estop = e.nearestAlightStop;
					        var sd = new Date(sstop.time);
					        var ed = new Date(estop.time);
					        var temp = {
					          id: e.id,
					          busnum: 'ID ' + e.id,
					          stime:  formatHHMM_ampm(sd),
					          etime:  formatHHMM_ampm(ed),
					          sstop:  sstop.stop.description,
					          estop:  estop.stop.description,
					          sident: 'ID ' + sstop.stop.postcode,
					          eident: 'ID ' + estop.stop.postcode,
					          sroad:  sstop.stop.road,
					          eroad:  estop.stop.road,
					          swalk:  e.distanceToStart.toFixed(0) + 'm',
					          ewalk:  e.distanceToEnd.toFixed(0) + 'm',
					          active: 'Mon-Fri only'
					        };
					        $scope.data.searchresults.push(temp);
					      }
		            //redirect the user to the LIST page
		            $scope.data.resultsModal.show();
					    }, 
					    function(err) {
					      console.log('Error retrieving Search Results - ');
					      console.log(err.toString());
					    }
				  	);
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

	      // Draw the line between them if both are set
	      $scope.map.lines[0].path = [];
	      if ($scope.data.pickupCoordinates && $scope.data.dropoffCoordinates) {
	      	$scope.map.lines[0].path = [
	      		{ latitude: $scope.data.pickupCoordinates.lat,
	            longitude: $scope.data.pickupCoordinates.lng },
	          { latitude: $scope.data.dropoffCoordinates.lat,
              longitude: $scope.data.dropoffCoordinates.lng }
					];
	      }

	      // Hide the center mark if both are set
	      if ($scope.data.pickupCoordinates && $scope.data.dropoffCoordinates) {
			    $scope.data.centerMarkIsVisible = false;
	      } else {
	      	$scope.data.centerMarkIsVisible = true;
	      }

	      // Zoom back out to the Singapore level if a single point is chosen
	      if (!$scope.data.pickupCoordinates || !$scope.data.dropoffCoordinates) {
	      	gmap.panTo({ lat: 1.370244, lng: 103.823315 });
					gmap.setZoom(11);
	      } 

	      // If both pickup and dropoff are chosen then frame around them
	      else if ($scope.data.pickupCoordinates && $scope.data.dropoffCoordinates) {
	        var bounds = new googleMaps.LatLngBounds();
	        bounds.extend(new google.maps.LatLng($scope.data.pickupCoordinates.lat, 
	        																		 $scope.data.pickupCoordinates.lng));
	        bounds.extend(new google.maps.LatLng($scope.data.dropoffCoordinates.lat, 
	        																		 $scope.data.dropoffCoordinates.lng));
        	gmap.fitBounds(bounds);
	      }

			});

		});
	});
};
