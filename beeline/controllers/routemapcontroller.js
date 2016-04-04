import {formatHHMM_ampm} from '../shared/format';
import _ from 'lodash'

export var RouteMapController =[
    '$scope',
    '$state',
    '$ionicModal',
    '$cordovaGeolocation',
    'uiGmapGoogleMapApi',
    'bookingService',
    'Search',
function(
    $scope,
    $state,
    $ionicModal,
    $cordovaGeolocation,
    uiGmapGoogleMapApi,
    BookingService,
    Search
){
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
		dragging: true,
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
		lines: [{
			id: 'routepath',
			path: [
			/*{
				latitude: 1.265426,
				longitude: 103.822106
			}, {
				latitude: 1.319582,
				longitude: 103.902807
			}*/
			],
			icons: [{
                icon: {
                    path: 1,
                    scale: 3,
                    strokeColor: '#333'
                },
                offset: '20%',
                repeat: '50px'
            }]
		}],
		events: { //empty functions - to be overwritten
			dragstart : function(map, e, args) {},
			zoom_changed : function(map, e, args) {},
			dragend : function(map, e, args) {},
			click : function(map, e, args) {}
		}
	};

	//HTML Elements above the Gmap are hidden at start
	$scope.rmap = {
		focus: 'pickupinput', //id of the input field
		pickuphide : true,
		dropoffhide: true,
		centmarkhide : true,
		locatemehide : true,
		btnnexthide : true,
		pickupvalue: '', //used by ng-model to display/store the txt value
		dropoffvalue: '',
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
        google.maps.event.trigger($scope.map.mapControl.getGMap(), 'resize');
    }
    $scope.$on('mapRequireResize', resizeMap);

	//Init the Search Results Modal
	$scope.rmap.resultsModal = $ionicModal.fromTemplate(require('./searchResults.html'), {
		scope: $scope,
		animation: 'slide-in-up'
	})

	//called whenever user clicks in text field
	$scope.inputFocus = function(event) {
		$scope.rmap.focus = event.target.id;

		//hide the icons above the map because the keyboard is damn big
		$scope.rmap.centmarkhide = true;
		$scope.rmap.locatemehide = true;
		$scope.rmap.btnnexthide = true;

		//display the 'clear text' icon when field contains txt
		if ((event.target.id == 'pickupinput')&&($scope.rmap.pickupvalue.trim() != ''))
		{
			//2nd field is shown, user clicks on 1st field to correct the start location
			//User could be doing this from 'Search Routes' or End location selection screens
			if ($scope.rmap.dropoffhide == false)
			{
				//clear polyline, start marker, end marker and dropoff location
				$scope.map.lines[0].path = [];
				$scope.map.markers = [];
				$scope.rmap.dlatlng = [];

				gmap.panTo(new google.maps.LatLng($scope.rmap.platlng[0], $scope.rmap.platlng[1]));
				setTimeout(function(){
					gmap.setZoom(17);
				}, 300);
			}

			//these are to be set AFTER the if clause above
			$scope.rmap.pclearhide =  false;
			$scope.rmap.dropoffhide = true;
		}

		//display cleartext icon for dropoff
		if ((event.target.id == 'dropoffinput')&&($scope.rmap.dropoffvalue.trim() != ''))
		{
			$scope.rmap.dclearhide =  false;

			//if user clicks this in 'readyToSubmit' mode, pan and zoom to the end location
			if ($scope.rmap.readyToSubmit == true)
			{
				$scope.map.markers = $scope.map.markers.slice(0,1);

				gmap.panTo(new google.maps.LatLng($scope.rmap.dlatlng[0], $scope.rmap.dlatlng[1]));
				setTimeout(function(){
					gmap.setZoom(17);
				}, 300);
			}
		}

		//restore center marker + button text in case user is making changes before submitting
		//$scope.rmap.centmarkhide = false;
		$scope.rmap.btnnexttxt = 'NEXT';
		$scope.rmap.readyToSubmit = false;
	}

	//Pickup field txt changed
	$scope.pickupTxtChange = function() {
		if ($scope.rmap.pickupvalue.trim() == '') //empty text
		{
			$scope.rmap.pickupvalue = '';
			$scope.rmap.platlng = [];
			$scope.rmap.pclearhide = true; //hide the X if text field is empty
		}
		else
			$scope.rmap.pclearhide = false;
	}

	//Dropoff field txt changed
	$scope.dropoffTxtChange = function() {
		if ($scope.rmap.dropoffvalue.trim() == '') //empty text
		{
			$scope.rmap.dropoffvalue = '';
			$scope.rmap.dlatlng = [];
			$scope.rmap.dclearhide = true;
		}
		else
			$scope.rmap.dclearhide = false;
	}

	//Clear the prev values + focus on the field again
	$scope.clearField = function(fieldId) {
		if (fieldId == 'pickupinput')
		{
			$scope.rmap.pickupvalue = '';
			$scope.rmap.platlng = [];
			$scope.rmap.pclearhide = true;
			document.getElementById('pickupinput').focus();
		}

		if (fieldId == 'dropoffinput')
		{
			$scope.rmap.dropoffvalue = '';
			$scope.rmap.dlatlng = [];
			$scope.rmap.dclearhide = true;
			document.getElementById('dropoffinput').focus();
		}
	}

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

		if ($scope.rmap.focus == 'pickupinput') //2nd input still hidden
		{
			val = $scope.rmap.pickupvalue;
			latlng = $scope.rmap.platlng;
		}
		else //2nd input shown
		{
			val = $scope.rmap.dropoffvalue;
			latlng = $scope.rmap.dlatlng;
		}

		if ((typeof(val) != 'undefined')&&(val != '')&&(latlng.length != 0))
			return false;
		else
			return true;
	}

	//Click function for the NEXT button
	$scope.nextBtnClick = function() {
		$scope.rmap.pclearhide = true;
		$scope.rmap.dclearhide = true;

		if ($scope.rmap.dropoffhide == true) {

			console.log('Start Location OK');

			//Plop down the Start Marker
			$scope.map.markers[0] = {
				id: '0',
				latitude: $scope.rmap.platlng[0],
				longitude: $scope.rmap.platlng[1],
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
			gmap.panTo(new google.maps.LatLng($scope.rmap.platlng[0], Number($scope.rmap.platlng[1]) + 0.0005));

			//show the dropoff field and set focus on it
			$scope.rmap.dropoffhide = false;
			$scope.rmap.focus = 'dropoffinput';
		}
		else { //drop off field is shown and filled

			if ($scope.rmap.readyToSubmit == false) //user not yet in Submit mode
			{
				console.log('End Location OK');

				//set a variable to indicate we are ready to submit
				$scope.rmap.readyToSubmit = true;

				//Plop down the End Marker
				$scope.map.markers[1] = {
					id: '1',
					latitude: $scope.rmap.dlatlng[0],
					longitude: $scope.rmap.dlatlng[1],
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
				$scope.rmap.centmarkhide = true;
				$scope.rmap.btnnexttxt = 'SEARCH ROUTES';

				//zoom out and show the entire route in the map
				var bounds = new google.maps.LatLngBounds();
				bounds.extend(new google.maps.LatLng($scope.rmap.platlng[0], $scope.rmap.platlng[1]));
				bounds.extend(new google.maps.LatLng($scope.rmap.dlatlng[0], $scope.rmap.dlatlng[1]));
				gmap.fitBounds(bounds);
			}
			else //user is one click away from submitting the search request
			{
				//place the start and end locations' latlng into the Search object
				Search.addReqData($scope.rmap.pickupvalue,
                    $scope.rmap.dropoffvalue,
                    $scope.rmap.platlng[0],
                    $scope.rmap.platlng[1],
                    $scope.rmap.dlatlng[0],
                    $scope.rmap.dlatlng[1]);

				//Update the Search Results modal with stuff retrieved from the DB
				$scope.showSearchResults();
			}
		}
	}

	//Redirect to Route Details
	$scope.showRouteDetails = function(item) {
		console.log('Redirect to route details page');

		//close the modal
		$scope.rmap.resultsModal.hide();

		//redirect to Routes Details
        BookingService.routeId = item.id;
		$state.go('tab.booking-pickup');
	};

	//Update the Search Results modal with stuff retrieved from the DB
	$scope.showSearchResults = function() {
		Search.getclosestroute().then(function(result){

			//store a copy of the search results in the Search object
			Search.setresults(result.data);

			//sift through the data to get the values we need
			$scope.rmap.searchresults = [];
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

				$scope.rmap.searchresults.push(temp);
			}
            //redirect the user to the LIST page
            $scope.rmap.resultsModal.show();

			//Kickstarter route data goes here
			/*
			$scope.rmap.searchkickstart = [{
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
		Search.setArrivalTime($scope.rmap.suggestTime);

		//close the modal
		$scope.rmap.resultsModal.hide();

		//redirect to the Suggestions page
		$state.go('tab.suggest', {
            action: 'submit',
        });
	};

	//Unhides the Center marker, the Locate Me and the Next button
	$scope.unhideOverlayIcons = function() {
		if ($scope.rmap.readyToSubmit == false)
		{
			$scope.rmap.centmarkhide = false;
			$scope.rmap.locatemehide = false;
			$scope.rmap.btnnexthide = false;
		}
	};

	//This will update the currently focused text input with the addres of the map center
	$scope.updateLocationText = function(map, e, args) {
		//user still choosing start & end points
		if ($scope.rmap.readyToSubmit == false)
		{
			var geocoder = new google.maps.Geocoder();
			geocoder.geocode({latLng: map.getCenter()}, function(r, s) {
				if (s == 'OK')
				{
					var center = map.getCenter().toJSON();

					if ($scope.rmap.dropoffhide == true) //2nd field still hidden
					{
						//store pickup location's latlng
						$scope.rmap.platlng = [center.lat.toFixed(6), center.lng.toFixed(6)];

						//refresh the text in the input field
						$scope.$apply(function(){
							$scope.rmap.pickupvalue = r[0].formatted_address;
						});
					}
					else //2nd field is present
					{
						//store pickup location's latlng
						$scope.rmap.dlatlng = [center.lat.toFixed(6), center.lng.toFixed(6)];

						//refresh the text in the input field
						$scope.$apply(function(){
							$scope.rmap.dropoffvalue = r[0].formatted_address;
						});

						//update the start and end points
						$scope.$apply(function(){
							$scope.map.lines[0].path = [{
								latitude: $scope.rmap.platlng[0],
								longitude: $scope.rmap.platlng[1]
							}, {
								latitude: $scope.rmap.dlatlng[0],
								longitude: $scope.rmap.dlatlng[1]
							}];
						});
					}

					//console.log(r[0].formatted_address + ' - ' + center.lat.toFixed(6) + ' ' + center.lng.toFixed(6));
				}
				else
					console.log('ERROR - geocoding error');
			});

		}//end if ($scope.rmap.readyToSubmit == false)

		//Once the user is in Submit mode, dragging the map around won't have any effect
	};

	//Google Maps - promise returns when map is ready, NOT when fully loaded
	uiGmapGoogleMapApi.then(function(map) {
		//custom vars for storing the text values of the pickup and dropoff txt fields
		$scope.rmap.pickuptxt = '';
		$scope.rmap.dropofftxt = '';

		//wait 1 second for DOM to load
		setTimeout(function(){
			//load google maps methods into gmap
			gmap = $scope.map.mapControl.getGMap();

			//sometimes the bottom tabs load slower than the Gmap
			//and that causes alignment issues with the center marker
			google.maps.event.trigger(gmap, 'resize');

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
			$scope.rmap.pickuphide = false;
			$scope.unhideOverlayIcons();
		}, 1000);

		//Attach Autocomplete Service to the PICKUP & DROPOFF text fields
		var pickupautocomp = new google.maps.places.Autocomplete(document.getElementById('pickupinput'));
		var dropoffautocomp = new google.maps.places.Autocomplete(document.getElementById('dropoffinput'));

		pickupautocomp.addListener('place_changed', function() {
			var pickupPos = pickupautocomp.getPlace().geometry.location.toJSON();

			$scope.rmap.pclearhide = true;
			$scope.unhideOverlayIcons();

			gmap.panTo(new google.maps.LatLng(pickupPos.lat, pickupPos.lng));
			setTimeout(function(){
				gmap.setZoom(17);
			}, 300);
		});

		dropoffautocomp.addListener('place_changed', function() {
			var dropoffPos = dropoffautocomp.getPlace().geometry.location.toJSON();

			$scope.rmap.pclearhide = true;
			$scope.rmap.dclearhide = true;
			$scope.unhideOverlayIcons();

			gmap.panTo(new google.maps.LatLng(dropoffPos.lat, dropoffPos.lng));
			setTimeout(function(){
				gmap.setZoom(17);
			}, 300);
		});


		/* ================== GOOGLE MAPS EVENT HANDLERS ============= */
		/*---- TAKE NOTE! The IDLE listener fires twice sometimes ---- */

		$scope.map.events = {
			dragstart: function(map, e, args) {
				//blur focus on current field
				document.getElementById($scope.rmap.focus).blur();

				$scope.unhideOverlayIcons();

				$scope.rmap.pclearhide = true;
				$scope.rmap.dclearhide = true;
			},
			zoom_changed: function(map, e, args) {
				document.getElementById($scope.rmap.focus).blur();
				$scope.updateLocationText(map, e, args);
			},
			dragend : function(map, e, args) {
				$scope.updateLocationText(map, e, args);
			},
			click : function(map, e, args) {
				$scope.$apply(function(){
					//blur focus on current field
					document.getElementById($scope.rmap.focus).blur();

					$scope.unhideOverlayIcons();

					$scope.rmap.pclearhide = true;
					$scope.rmap.dclearhide = true;
				});
			}

		}//end $scope.map.events

    }); //end Google maps callback function
}];
