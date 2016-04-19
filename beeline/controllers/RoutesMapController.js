export default function($scope, $state, $cordovaGeolocation,
                        uiGmapGoogleMapApi, RoutesService) {
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
      styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
    },
    //empty functions - to be overwritten
    events: {
      dragstart: function(map, eventName, args) {},
      zoom_changed: function(map, eventName, args) {},
      dragend: function(map, eventName, args) {},
      click: function(map, eventName, args) {}
    },
    markers: [],
    lines: [{
      id: 'routepath',
      path: [],
      stroke: { opacity: 0 },
      icons: [{
        icon: {
          path: 'M 0,-1 0,1',
          strokeOpacity: 1,
          scale: 2
        },
        offset: '0',
        repeat: '10px'
      }]
    }],
  };

  //HTML Elements above the Gmap are hidden at start
  $scope.data = {};

  uiGmapGoogleMapApi.then(function(googleMaps) {
    $scope.$watch('map.control.getGMap', function() {
      if ($scope.map.control.getGMap) {

        var gmap = $scope.map.control.getGMap();
        var pickupInputElement = document.getElementById('pickup-input');
        var dropoffInputElement = document.getElementById('dropoff-input');

        // Hide uneccessary UI elements when typing in the text inputs
        $scope.pickupFocus = $scope.dropoffFocus = function() {};
        $scope.pickupBlur = $scope.dropoffBlur = function() {};

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
          $scope.$apply(function() {
            $scope.data.pickupCoordinates = pickupAutocompleter.getPlace().geometry.location.toJSON();
          });
        });
        dropoffAutocompleter.addListener('place_changed', function() {
          $scope.$apply(function() {
            $scope.data.dropoffCoordinates = dropoffAutocompleter.getPlace().geometry.location.toJSON();
          });
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
        $scope.locateMe = function() {
          $cordovaGeolocation
          .getCurrentPosition({ timeout: 5000, enableHighAccuracy: true })
          .then(function(userPosition) {
            gmap.panTo(new google.maps.LatLng(userPosition.coords.latitude, userPosition.coords.longitude));
            gmap.setZoom(17);
          });
        };

        // Configure the crosshair clickability
        $scope.setPickup = function() {
          $scope.data.pickupCoordinates = gmap.getCenter().toJSON();
        };
        $scope.setDropoff = function() {
          $scope.data.dropoffCoordinates = gmap.getCenter().toJSON();
        };
        $scope.searchForRoutes = function() {
          $state.go('tabs.results', {
            pickupLat: $scope.data.pickupCoordinates.lat,
            pickupLng: $scope.data.pickupCoordinates.lng,
            dropoffLat: $scope.data.dropoffCoordinates.lat,
            dropoffLng: $scope.data.dropoffCoordinates.lng
          });
        };

        //////////////////////////////////////////////////////////////////////////
        // Hack to fix map resizing due to ionic view cacheing
        // TODO find a better way?
        //////////////////////////////////////////////////////////////////////////
        googleMaps.event.trigger(gmap, 'resize');
        $scope.$on('mapRequireResize', function() {
          googleMaps.event.trigger(gmap, 'resize');
        });
        //////////////////////////////////////////////////////////////////////////

        //////////////////////////////////////////////////////////////////////////
        // Google maps click fix hacks
        //////////////////////////////////////////////////////////////////////////
        //Disable the Google link at the bottom left of the map
        var glink = angular.element(document.getElementsByClassName('gm-style-cc'));
        glink.next().find('a').on('click', function(e) {e.preventDefault(); });
        //Hack to get autocomplete to work on mobile devices
        //Normally ionic intercepts the taps this causes the dropdown list
        //to disappear before the clicked item is registered,
        //this will disable the click event on the lists' containers
        setTimeout(function() {
          var contain = document.getElementsByClassName('pac-container');
          angular.element(contain).attr('data-tap-disabled', 'true');
        }, 300);
        //////////////////////////////////////////////////////////////////////////

        // Configure the UI in accordance with the users set/unset coordinates
        $scope.$watchGroup(['data.pickupCoordinates', 'data.dropoffCoordinates'], function() {

          // Configure the crosshair and search button according to what has been set
          if (!$scope.data.pickupCoordinates) {
            $scope.data.showPickupCrosshair = true;
            $scope.data.showDropoffCrosshair = false;
            $scope.data.showSearchButton = false;
          }
          else if ($scope.data.pickupCoordinates &&
                   !$scope.data.dropoffCoordinates) {
            $scope.data.showPickupCrosshair = false;
            $scope.data.showDropoffCrosshair = true;
            $scope.data.showSearchButton = false;
          }
          else if ($scope.data.pickupCoordinates &&
                   $scope.data.dropoffCoordinates) {
            $scope.data.showPickupCrosshair = false;
            $scope.data.showDropoffCrosshair = false;
            $scope.data.showSearchButton = true;
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
                url: './img/RoutePairBigStart@2x.png',
                size: new googleMaps.Size(48, 48),
                scaledSize: new googleMaps.Size(24, 24),
                origin: new googleMaps.Point(0, 0),
                anchor: new googleMaps.Point(12, 12),
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
                url: './img/RoutePairBigEnd@2x.png',
                size: new googleMaps.Size(48, 48),
                scaledSize: new googleMaps.Size(24, 24),
                origin: new googleMaps.Point(0, 0),
                anchor: new googleMaps.Point(12, 12),
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
      }
    });
  });
}
