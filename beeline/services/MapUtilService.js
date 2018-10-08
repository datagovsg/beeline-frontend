import _ from 'lodash'

angular.module('beeline').service('MapUtilService', [
  'uiGmapGoogleMapApi',
  'OneMapPlaceService',
  function MapUtilService (uiGmapGoogleMapApi, OneMapPlaceService) {
    let markerOptionsPromise = uiGmapGoogleMapApi.then(googleMaps => {
      return {
        markerOptions: {
          normalMarker: {
            icon: {
              url: 'img/map/Icon_NormalWShadow.svg',
              scaledSize: new googleMaps.Size(26, 25),
              anchor: new googleMaps.Point(13, 13),
            },
            zIndex: google.maps.Marker.MAX_ZINDEX + 1,
          },
          boardMarker: {
            icon: {
              url: 'img/map/Icon_PickupWShadow.svg',
              scaledSize: new googleMaps.Size(26, 25),
              anchor: new googleMaps.Point(13, 13),
            },
            zIndex: google.maps.Marker.MAX_ZINDEX + 1,
          },
          alightMarker: {
            icon: {
              url: 'img/map/Icon_DropoffWShadow.svg',
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
          normalPinMarker: {
            icon: {
              url: 'img/map/SelectedPinNormal@2x.png',
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
            opacity: 0.7,
          },
          crowdstartPath: {
            color: '#AAAAAA',
            weight: 3.0,
            opacity: 0.4,
          },
          actualPath: {
            color: '#000000',
            weight: 3.0,
            opacity: 1.0,
          },
        },
        bounds: {
          Singapore: {
            north: 1.516329,
            east: 104.08,
            south: 1.1954,
            west: 103.5814,
          },
        },
      }
    })

    uiGmapGoogleMapApi.then(googleMaps => {
      navigator.geolocation.watchPosition(
        async success => {
          const location = await OneMapPlaceService.reverseGeocode(
            success.coords.latitude,
            success.coords.longitude
          )
          this.coords = {
            latitude: success.coords.latitude,
            longitude: success.coords.longitude,
            location,
          }
        },
        error => {
          this.coords = null
          console.error(error)
        },
        {
          enableHighAccuracy: false,
        }
      )
    })

    this.getMyLocation = function () {
      return this.coords
    }

    this.defaultMapOptions = function (options) {
      let mapOptions = _.assign(
        {
          center: { latitude: 1.370244, longitude: 103.823315 },
          zoom: 11,
          bounds: {
            // so that autocomplete will mainly search within Singapore
            northeast: {
              latitude: 1.485152,
              longitude: 104.091837,
            },
            southwest: {
              latitude: 1.205764,
              longitude: 103.589899,
            },
          },
          control: {},
          options: {
            disableDefaultUI: true,
            styles: [
              {
                featureType: 'poi',
                stylers: [
                  {
                    visibility: 'off',
                  },
                ],
              },
            ],
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
        },
        options || {}
      )

      markerOptionsPromise.then(options => {
        _.assign(mapOptions, options)
      })

      return mapOptions
    }

    this.disableMapLinks = function () {
      setTimeout(function () {
        let anchorElems = document.querySelectorAll(
          'ui-gmap-google-map a[href]'
        )

        for (let i = 0; i < anchorElems.length; i++) {
          let anchorElem = anchorElems[i]
          if (!anchorElem.dataset['clickDisabled']) {
            anchorElem.addEventListener('click', e => e.preventDefault())
            anchorElem.dataset['clickDisabled'] = true
          }
        }
      }, 300)
    }

    this.formBounds = async function (stops) {
      if (stops.length === 0) {
        return
      }
      await uiGmapGoogleMapApi
      let bounds = new google.maps.LatLngBounds()
      for (let s of stops) {
        bounds.extend(
          new google.maps.LatLng(
            s.coordinates.coordinates[1],
            s.coordinates.coordinates[0]
          )
        )
      }
      return bounds
    }
  },
])
