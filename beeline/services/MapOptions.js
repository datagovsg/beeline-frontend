var googleMaps;

export default [
  'uiGmapGoogleMapApi', '$cordovaGeolocation',
  function(uiGmapGoogleMapApi, $cordovaGeolocation) {
    var markerOptionsPromise = uiGmapGoogleMapApi.then((googleMaps) => {
      return {
        markerOptions: {
          boardMarker: {
            icon: {
              url: 'img/map/MapRoutePickupStop@2x.png',
              scaledSize: new googleMaps.Size(26, 25),
              anchor: new googleMaps.Point(13, 13),
            },
            zIndex: google.maps.Marker.MAX_ZINDEX + 1,
          },
          alightMarker: {
            icon: {
              url: 'img/map/MapRouteDropoffStop@2x.png',
              scaledSize: new googleMaps.Size(26, 25),
              anchor: new googleMaps.Point(13, 13),
            },
            zIndex: google.maps.Marker.MAX_ZINDEX + 1,
          },
          startMarker: {
            icon: {
              url: 'img/map/SelectedPinStart@2x.png',
              scaledSize: new googleMaps.Size(34, 46),
              anchor: new googleMaps.Point(17, 41),
            },
            zIndex: google.maps.Marker.MAX_ZINDEX + 2,
          },
          endMarker: {
            icon: {
              url: 'img/map/SelectedPinStop@2x.png',
              scaledSize: new googleMaps.Size(34, 46),
              anchor: new googleMaps.Point(17, 41),
            },
            zIndex: google.maps.Marker.MAX_ZINDEX + 2,
          },
        },
        pathOptions: {
          routePath: {
            color: '#4b3863',
            weight: 3.0,
            opacity: 0.7
          },
          actualPath: {
            color: '#000000',
            weight: 3.0,
            opacity: 1.0
          }
        },
        bounds: {
          Singapore: {
  	        north: 1.516329,
  	        east: 104.08,
  	        south: 1.1954,
  	        west: 103.5814
  	      }
        }
      };
    });

    this.defaultMapOptions = function(options) {
      var mapOptions = _.assign({
        center: {latitude: 1.370244, longitude: 103.823315},
        zoom: 11,
        bounds: { // so that autocomplete will mainly search within Singapore
          northeast: {
              latitude: 1.485152,
              longitude: 104.091837
            },
          southwest: {
              latitude: 1.205764,
              longitude: 103.589899
            }
        },
        control: {},
        options: {
          disableDefaultUI: true,
          styles: [{
              featureType: "poi",
              stylers: [{
                  visibility: "off"
                }]
            }],
          draggable: true,
          gestureHandling: 'greedy',
        },
        markerOptions: {
          alightMarker: {},
          boardMarker: {},
          startMarker: {},
          endMarker: {},
        },
        events: {},
        markers: [],
        lines: [],
      }, options || {});

      markerOptionsPromise.then((options) => {
        _.assign(mapOptions, options);
      })

      return mapOptions;
    };

    this.locateMe = function(mapControl) {
      var options = {
        timeout: 5000,
        enableHighAccuracy: true
      };

      // promise
      // FIXME: use navigator.geoLocation
      $cordovaGeolocation
      .getCurrentPosition({timeout: 5000, enableHighAccuracy: true})
      .then(function(userpos) {
        if (!mapControl.getGMap) return;

        var gmap = mapControl.getGMap();

        gmap.panTo(new google.maps.LatLng(userpos.coords.latitude, userpos.coords.longitude));
        setTimeout(function() {
          gmap.setZoom(17);
        }, 300);

      }, function(err) {
        console.log('ERROR - ' + err);
      });
    };

    this.disableMapLinks = function () {
      setTimeout(function() {
        var anchorElems = document.querySelectorAll('ui-gmap-google-map a[href]')

        for (let i=0; i<anchorElems.length; i++) {
          let anchorElem = anchorElems[i];
          if (!anchorElem.dataset['clickDisabled']) {
            anchorElem.addEventListener('click', e => e.preventDefault());
            anchorElem.dataset['clickDisabled'] = true;
          }
        }
      }, 300);
    }

    this.resizePreserveCenter = function(map) {
      let oldCenter = map.getCenter();
      google.maps.event.trigger(map, 'resize');
      map.setCenter(oldCenter);
    };

  }
];
