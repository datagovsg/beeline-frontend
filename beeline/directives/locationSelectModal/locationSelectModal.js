import locationSelectModalTemplate from './locationSelectModal.html'
import _ from 'lodash'

angular.module('beeline').directive('locationSelectModal', [
  '$stateParams',
  'OneMapPlaceService',
  'MapUtilService',
  function (
    $stateParams,
    OneMapPlaceService,
    MapUtilService,
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
            location = OneMapPlaceService.getTopResult(location)
          }

          if (typeof scope.callback === 'function') {
            Promise.resolve(location).then(scope.callback)
          }
          scope.modal.hide()
        }

        scope.selectMyLocation = () => {
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
