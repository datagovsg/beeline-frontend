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
          OneMapPlaceService.getAllResults(scope.data.input).then(results => {
            scope.isFiltering = false
            if (results) {
              scope.results = results.results
            } else {
              scope.results = []
            }
            scope.$digest()
          })
        }, 500)

        // ---------------------------------------------------------------------
        // Data Initialization
        // ---------------------------------------------------------------------
        let defaultResults = null

        scope.data = {
          input: scope.location ? scope.location.ADDRESS : null,
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

        Promise.all(defaultResults.map(result => {
          return OneMapPlaceService.getAllResults(result).then(results => {
            if (results) {
              let location = results.results[0]
              location.ADDRESS = result
              return location
            }
          })
        })).then(results => {
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

        scope.select = async location => {
          if (typeof location === 'string') return

          scope.selectedLocation = location
          if (typeof scope.callback === 'function') {
            scope.callback(scope.selectedLocation)
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
