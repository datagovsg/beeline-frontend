import locationSelectModalTemplate from './locationSelectModal.html'
import _ from 'lodash'

angular.module('beeline').directive('locationSelectModal', [
  '$stateParams',
  'OneMapPlaceService',
  'MapUtilService',
  'GoogleAnalytics',
  'loadingSpinner',
  function (
    $stateParams,
    OneMapPlaceService,
    MapUtilService,
    GoogleAnalytics,
    loadingSpinner
  ) {
    return {
      restrict: 'E',
      template: locationSelectModalTemplate,
      scope: {
        queryLocation: '=',
        modal: '=',
        type: '=',
        callback: '=',
        location: '=',
      },
      link: function (scope, element, attributes) {
        // ---------------------------------------------------------------------
        // Helper Functions
        // ---------------------------------------------------------------------
        const search = _.debounce(() => {
          if (!scope.data.input) return

          // Send search term to GA
          GoogleAnalytics.send('send', 'event', {
            eventCategory: 'search',
            eventAction: 'search input - ' + scope.type,
            eventLabel: scope.data.input,
          })

          scope.isFiltering = true
          const currentPromise =
                scope.data.latestPromise =
                OneMapPlaceService
                  .getAllResults(scope.data.input)
                  .then(results => {
                    if (currentPromise === scope.data.latestPromise) {
                      scope.isFiltering = false
                      if (results) {
                        scope.results = results.results
                      } else {
                        scope.results = []
                      }
                      scope.$digest()
                    }
                  })
        }, 500)

        const hide = () => {
          scope.modal.hide()
        }

        // ---------------------------------------------------------------------
        // Data Initialization
        // ---------------------------------------------------------------------
        let defaultResults = null

        scope.data = {
          input: scope.location ? scope.location.ADDRESS : null,
          latestPromise: null,
          myLocation: null,
        }

        if (scope.type === 'pickup') {
          defaultResults = [
            'Punggol MRT',
            'Jurong East MRT',
            'Sengkang MRT',
            'Tampines MRT',
            'Woodlands MRT',
            'Yishun MRT',
            'Bedok MRT',
          ]
        } else if (scope.type === 'dropoff') {
          defaultResults = [
            'Changi Naval Base',
            'Tuas Naval Base',
            'Raffles Place MRT',
            'Mapletree Business City',
            'Tanjong Pagar MRT',
            'Changi Business Park',
            'Buona Vista MRT',
            'Depot Road',
            'One North MRT',
          ]
        }

        scope.defaultResults = defaultResults

        scope.placeholder = scope.type === 'pickup' ? 'Pick Up Address' : 'Drop Off Address'

        // ---------------------------------------------------------------------
        // Data Loading
        // ---------------------------------------------------------------------

        // ---------------------------------------------------------------------
        // Watchers
        // ---------------------------------------------------------------------
        scope.$watch('data.input', input => {
          // if input is same as location, means we just entered and can search
          // straight away
          if (location && input === location.ADDRESS) {
            search()
            search.flush()
          } else if (!input || input.length < 3) {
            scope.data.latestPromise = null
            scope.results = null
          } else {
            search()
          }
        })

        scope.$watch(() => MapUtilService.getMyLocation(),
          (myLocation) => {
            scope.data.myLocation = myLocation ? myLocation.location : null
          }
        )

        // ---------------------------------------------------------------------
        // UI Hooks
        // ---------------------------------------------------------------------
        scope.closeModal = () => {
          scope.modal.hide()
        }

        scope.select = location => {
          if (!location) return

          if (typeof location === 'string') {
            let label = ''
            if (scope.defaultResults.includes(location)) {
              label = 'default location - '
            }
            GoogleAnalytics.send('send', 'event', {
              eventCategory: 'search',
              eventAction: 'location select - ' + scope.type,
              eventLabel: label + location,
            })
            location = OneMapPlaceService.getTopResult(location)
          } else {
            GoogleAnalytics.send('send', 'event', {
              eventCategory: 'search',
              eventAction: 'location select - ' + scope.type,
              eventLabel: location.ADDRESS || location.BUILDING || location.ROAD_NAME,
            })
          }

          if (typeof scope.callback === 'function') {
            loadingSpinner(
              Promise.resolve(location).then(scope.callback, hide).then(hide)
            )
          } else {
            hide()
          }
        }

        scope.selectMyLocation = () => {
          GoogleAnalytics.send('send', 'event', {
            eventCategory: 'search',
            eventAction: 'location select - ' + scope.type,
            eventLabel: 'my location',
          })
          scope.select(scope.data.myLocation)
        }

        scope.clearInput = () => {
          scope.data.input = null
        }

        scope.submit = () => {
          scope.select(scope.data.input)
        }

        scope.hideKeyboard = () => {
          document.activeElement.blur()
        }

        // ---------------------------------------------------------------------
        // Event handlers
        // ---------------------------------------------------------------------
      },
    }
  },
])
