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
	}

	//empty placeholder for mapcontrol object
	var gmap;

  async function resizeMap() {
      await uiGmapGoogleMapApi;
      google.maps.event.trigger($scope.map.control.getGMap(), 'resize');
  }
  $scope.$on('mapRequireResize', resizeMap);

	//Init the Search Results Modal
	$scope.data.resultsModal = $ionicModal.fromTemplate(require('./searchResults.html'), {
		scope: $scope,
		animation: 'slide-in-up'
	})

	//called whenever user clicks in text field
	$scope.inputFocus = function(event) {
		$scope.data.focus = event.target.id;

		//hide the icons above the map because the keyboard is damn big
		$scope.data.centmarkhide = true;
		$scope.data.locatemehide = true;
		$scope.data.btnnexthide = true;

		//display the 'clear text' icon when field contains txt
		if ((event.target.id == 'pickupinput')&&($scope.data.pickupText.trim() != ''))
		{
			//2nd field is shown, user clicks on 1st field to correct the start location
			//User could be doing this from 'Search Routes' or End location selection screens
			if ($scope.data.dropoffhide == false)
			{
				//clear polyline, start marker, end marker and dropoff location
				$scope.map.lines[0].path = [];
				$scope.map.markers = [];
				$scope.data.dlatlng = [];

				gmap.panTo(new google.maps.LatLng($scope.data.platlng[0], $scope.data.platlng[1]));
				setTimeout(function(){
					gmap.setZoom(17);
				}, 300);
			}

			//these are to be set AFTER the if clause above
			$scope.data.pclearhide =  false;
			$scope.data.dropoffhide = true;
		}

		//display cleartext icon for dropoff
		if ((event.target.id == 'dropoffinput')&&($scope.data.dropoffText.trim() != ''))
		{
			$scope.data.dclearhide =  false;

			//if user clicks this in 'readyToSubmit' mode, pan and zoom to the end location
			if ($scope.data.readyToSubmit == true)
			{
				$scope.map.markers = $scope.map.markers.slice(0,1);

				gmap.panTo(new google.maps.LatLng($scope.data.dlatlng[0], $scope.data.dlatlng[1]));
				setTimeout(function(){
					gmap.setZoom(17);
				}, 300);
			}
		}

		//restore center marker + button text in case user is making changes before submitting
		//$scope.data.centmarkhide = false;
		$scope.data.btnnexttxt = 'NEXT';
		$scope.data.readyToSubmit = false;
	}

	//Pickup field txt changed
	$scope.pickupTxtChange = function() {
		if ($scope.data.pickupText.trim() == '') //empty text
		{
			$scope.data.pickupText = '';
			$scope.data.platlng = [];
			$scope.data.pclearhide = true; //hide the X if text field is empty
		}
		else
			$scope.data.pclearhide = false;
	}

	//Dropoff field txt changed
	$scope.dropoffTxtChange = function() {
		if ($scope.data.dropoffText.trim() == '') //empty text
		{
			$scope.data.dropoffText = '';
			$scope.data.dlatlng = [];
			$scope.data.dclearhide = true;
		}
		else
			$scope.data.dclearhide = false;
	}

	//Clear the prev values + focus on the field again
	$scope.clearPickup = function(){
		$scope.data.pickupText = '';
		$scope.data.platlng = [];
		$scope.data.pclearhide = true;
		document.getElementById('pickupinput').focus();
	};

	$scope.clearDropoff = function(){
		$scope.data.dropoffText = '';
		$scope.data.dlatlng = [];
		$scope.data.dclearhide = true;
		document.getElementById('dropoffinput').focus();
	};

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

	//The focused input field must be filled before the NEXT button is active
	$scope.nextNotAllowed = function() {
		var val, latlng;

		if ($scope.data.focus == 'pickupinput') //2nd input still hidden
		{
			val = $scope.data.pickupText;
			latlng = $scope.data.platlng;
		}
		else //2nd input shown
		{
			val = $scope.data.dropoffText;
			latlng = $scope.data.dlatlng;
		}

		if ((typeof(val) != 'undefined')&&(val != '')&&(latlng.length != 0))
			return false;
		else
			return true;
	}

	//Click function for the NEXT button
	$scope.nextBtnClick = function() {
		$scope.data.pclearhide = true;
		$scope.data.dclearhide = true;

		if ($scope.data.dropoffhide == true) {

			console.log('Start Location OK');

			//Plop down the Start Marker
			$scope.map.markers[0] = {
				id: '0',
				latitude: $scope.data.platlng[0],
				longitude: $scope.data.platlng[1],
				title: 'StartMarker',
				icon: {
					url: './img/icon-marker-big.png',
					size: new google.maps.Size(49, 59),
					origin: new google.maps.Point(0,0),
					anchor: new google.maps.Point(14, 34),
					scaledSize: new google.maps.Size(28.125, 33.86)
				}
			}

			//Pan the map slightly to the right
			gmap.panTo(new google.maps.LatLng($scope.data.platlng[0], Number($scope.data.platlng[1]) + 0.0005));

			//show the dropoff field and set focus on it
			$scope.data.dropoffhide = false;
			$scope.data.focus = 'dropoffinput';
		}
		else { //drop off field is shown and filled

			if ($scope.data.readyToSubmit == false) //user not yet in Submit mode
			{
				console.log('End Location OK');

				//set a variable to indicate we are ready to submit
				$scope.data.readyToSubmit = true;

				//Plop down the End Marker
				$scope.map.markers[1] = {
					id: '1',
					latitude: $scope.data.dlatlng[0],
					longitude: $scope.data.dlatlng[1],
					title: 'EndMarker',
					icon: {
						url: './img/icon-marker-big.png',
						size: new google.maps.Size(49, 59),
						origin: new google.maps.Point(0,0),
						anchor: new google.maps.Point(14, 34),
						scaledSize: new google.maps.Size(28.125, 33.86)
					}
				}

				//Hide centermarker + change button text to SEARCH ROUTES
				$scope.data.centmarkhide = true;
				$scope.data.btnnexttxt = 'SEARCH ROUTES';

				//zoom out and show the entire route in the map
				var bounds = new google.maps.LatLngBounds();
				bounds.extend(new google.maps.LatLng($scope.data.platlng[0], $scope.data.platlng[1]));
				bounds.extend(new google.maps.LatLng($scope.data.dlatlng[0], $scope.data.dlatlng[1]));
				gmap.fitBounds(bounds);
			}
			else //user is one click away from submitting the search request
			{
				//place the start and end locations' latlng into the Search object
				RoutesService.addReqData($scope.data.pickupText,
                    $scope.data.dropoffText,
                    $scope.data.platlng[0],
                    $scope.data.platlng[1],
                    $scope.data.dlatlng[0],
                    $scope.data.dlatlng[1]);

				//Update the Search Results modal with stuff retrieved from the DB
				$scope.showSearchResults();
			}
		}
	}

	//Redirect to Route Details
	$scope.showRouteDetails = function(item) {
		console.log('Redirect to route details page');

		//close the modal
		$scope.data.resultsModal.hide();

		//redirect to Routes Details
        BookingService.routeId = item.id;
		$state.go('tabs.booking-pickup');
	};

	//Update the Search Results modal with stuff retrieved from the DB
	$scope.showSearchResults = function() {
		RoutesService.getclosestroute().then(function(result){

			//store a copy of the search results in the Search object
			RoutesService.setresults(result.data);

			//sift through the data to get the values we need
			$scope.data.searchresults = [];
			for(var i=0; i<result.data.length; i++)
			{
				var e = result.data[i];
				var sstop = e.nearestBoardStop;
				var estop = e.nearestAlightStop;

				var sd = new Date(sstop.time);
				var ed = new Date(estop.time);

				var temp = {
					id: e.id,
					busnum: 'ID ' + e.id,
					stime:	formatHHMM_ampm(sd),
					etime:	formatHHMM_ampm(ed),
					sstop:	sstop.stop.description,
					estop:	estop.stop.description,
					sident:	'ID ' + sstop.stop.postcode,
					eident:	'ID ' + estop.stop.postcode,
					sroad:	sstop.stop.road,
					eroad:	estop.stop.road,
					swalk:	e.distanceToStart.toFixed(0) + 'm',
					ewalk:	e.distanceToEnd.toFixed(0) + 'm',
					active: 'Mon-Fri only'
				};

				$scope.data.searchresults.push(temp);
			}
            //redirect the user to the LIST page
            $scope.data.resultsModal.show();

			//Kickstarter route data goes here
			/*
			$scope.data.searchkickstart = [{
				stime:	'7:15 am',
				etime:	'7:50 am',
				sstop:	'Opp The Treasury (Bus Stop ID 04249)',
				estop:	'Serangoon Station (Bus Stop ID 66359)',
				sroad:	'Punggol Ave 2',
				eroad:	'Serangoon Nex',
				dleft:	'5',
				sdate:	'12 Mar',
				pcurr:	'25%',
				pneed:	'4',
				price:	'7.50'
			}];
			*/
		}, function(err) {
			console.log('Error retrieving Search Results - ');
			console.log(err.toString());
		});
	}

	//Route Suggestion button clicked - redirect to Suggestion page
	$scope.routeSuggest = function() {
		RoutesService.setArrivalTime($scope.data.suggestTime);

		//close the modal
		$scope.data.resultsModal.hide();

		//redirect to the Suggestions page
		$state.go('tabs.suggest', {
            action: 'submit',
        });
	};

	//Unhides the Center marker, the Locate Me and the Next button
	$scope.unhideOverlayIcons = function() {
		if ($scope.data.readyToSubmit == false)
		{
			$scope.data.centmarkhide = false;
			$scope.data.locatemehide = false;
			$scope.data.btnnexthide = false;
		}
	};

	//This will update the currently focused text input with the addres of the map center
	$scope.updateLocationText = function(map, e, args) {
		//user still choosing start & end points
		if ($scope.data.readyToSubmit == false)
		{
			var geocoder = new google.maps.Geocoder();
			geocoder.geocode({latLng: map.getCenter()}, function(r, s) {
				if (s == 'OK')
				{
					var center = map.getCenter().toJSON();

					if ($scope.data.dropoffhide == true) //2nd field still hidden
					{
						//store pickup location's latlng
						$scope.data.platlng = [center.lat.toFixed(6), center.lng.toFixed(6)];

						//refresh the text in the input field
						$scope.$apply(function(){
							$scope.data.pickupText = r[0].formatted_address;
						});
					}
					else //2nd field is present
					{
						//store pickup location's latlng
						$scope.data.dlatlng = [center.lat.toFixed(6), center.lng.toFixed(6)];

						//refresh the text in the input field
						$scope.$apply(function(){
							$scope.data.dropoffText = r[0].formatted_address;
						});

						//update the start and end points
						$scope.$apply(function(){
							$scope.map.lines[0].path = [{
								latitude: $scope.data.platlng[0],
								longitude: $scope.data.platlng[1]
							}, {
								latitude: $scope.data.dlatlng[0],
								longitude: $scope.data.dlatlng[1]
							}];
						});
					}

					//console.log(r[0].formatted_address + ' - ' + center.lat.toFixed(6) + ' ' + center.lng.toFixed(6));
				}
				else
					console.log('ERROR - geocoding error');
			});

		}//end if ($scope.data.readyToSubmit == false)

		//Once the user is in Submit mode, dragging the map around won't have any effect
	};

	//Google Maps - promise returns when map is ready, NOT when fully loaded
	uiGmapGoogleMapApi.then(function(googleMaps) {
		//custom vars for storing the text values of the pickup and dropoff txt fields
		$scope.data.pickuptxt = '';
		$scope.data.dropofftxt = '';

		$scope.$on('$viewContentLoaded', function(){
    //Here your view content is fully loaded !!
  	});
		
		//wait 1 second for DOM to load
		setTimeout(function(){
			//load google maps methods into gmap
			gmap = $scope.map.control.getGMap();

			//sometimes the bottom tabs load slower than the Gmap
			//and that causes alignment issues with the center marker
			googleMaps.event.trigger(gmap, 'resize');

			//Disable the Google link at the bottom left of the map
			var glink = angular.element(document.getElementsByClassName("gm-style-cc"));
			glink.next().find('a').on('click', function (e) {
				e.preventDefault();
			});

			//drop down list disappears before the clicked item is registered,
			//this will disable the click event on the lists' containers
			var contain = document.getElementsByClassName('pac-container');
			angular.element(contain).attr('data-tap-disabled', 'true');

			//Unhide the elements on top of the Gmap
			$scope.data.pickuphide = false;
			$scope.unhideOverlayIcons();
		}, 1000);

		//Attach Autocomplete Service to the PICKUP & DROPOFF text fields
		var pickupautocomp = new googleMaps.places.Autocomplete(document.getElementById('pickupinput'));
		var dropoffautocomp = new googleMaps.places.Autocomplete(document.getElementById('dropoffinput'));

		pickupautocomp.addListener('place_changed', function() {
			var pickupPos = pickupautocomp.getPlace().geometry.location.toJSON();

			$scope.data.pclearhide = true;
			$scope.unhideOverlayIcons();

			gmap.panTo(new googleMaps.LatLng(pickupPos.lat, pickupPos.lng));
			setTimeout(function(){
				gmap.setZoom(17);
			}, 300);
		});

		dropoffautocomp.addListener('place_changed', function() {
			var dropoffPos = dropoffautocomp.getPlace().geometry.location.toJSON();

			$scope.data.pclearhide = true;
			$scope.data.dclearhide = true;
			$scope.unhideOverlayIcons();

			gmap.panTo(new googleMaps.LatLng(dropoffPos.lat, dropoffPos.lng));
			setTimeout(function(){
				gmap.setZoom(17);
			}, 300);
		});


		/* ================== GOOGLE MAPS EVENT HANDLERS ============= */
		/*---- TAKE NOTE! The IDLE listener fires twice sometimes ---- */

		$scope.map.events = {
			dragstart: function(map, e, args) {
				//blur focus on current field
				document.getElementById($scope.data.focus).blur();

				$scope.unhideOverlayIcons();

				$scope.data.pclearhide = true;
				$scope.data.dclearhide = true;
			},

			zoom_changed: function(map, e, args) {
				document.getElementById($scope.data.focus).blur();
				$scope.updateLocationText(map, e, args);
			},

			dragend : function(map, e, args) {
				$scope.updateLocationText(map, e, args);
			},

			click : function(map, e, args) {
				$scope.$apply(function(){
					//blur focus on current field
					document.getElementById($scope.data.focus).blur();

					$scope.unhideOverlayIcons();

					$scope.data.pclearhide = true;
					$scope.data.dclearhide = true;
				});
			}

		}//end $scope.map.events

  }); //end Google maps callback function
};
