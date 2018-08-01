import locationSelectModalTemplate from './locationSelectModal.html'
import _ from 'lodash'

angular.module('beeline').directive('locationSelectModal', [
  '$stateParams',
  'OneMapPlaceService',
  function (
    $stateParams,
    OneMapPlaceService,
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

        Promise.all(defaultResults.map(OneMapPlaceService.getTopResult))
          .then(results => {
            scope.isFiltering = false
            scope.defaultResults = results
          })

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
            return
          }

          if (typeof scope.callback === 'function') {
            scope.callback(Promise.resolve(location))
          }
          scope.modal.hide()
        }

        scope.clearInput = () => {
          scope.data.input = null
        }

        // ---------------------------------------------------------------------
        // Event handlers
        // ---------------------------------------------------------------------
      },
    }
  },
])
