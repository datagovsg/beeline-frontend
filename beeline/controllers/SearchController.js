import _ from 'lodash'

export default [
  '$scope',
  '$stateParams',
  '$timeout',
  '$ionicHistory',
  '$ionicLoading',
  '$ionicPopup',
  '$ionicScrollDelegate',
  'RoutesService',
  'BookingService',
  'MapService',
  'OneMapPlaceService',
  async function (
    $scope,
    $stateParams,
    $timeout,
    $ionicHistory,
    $ionicLoading,
    $ionicPopup,
    $ionicScrollDelegate,
    RoutesService,
    BookingService,
    MapService,
    OneMapPlaceService,
  ) {
    // ------------------------------------------------------------------------
    // Helper functions
    // ------------------------------------------------------------------------
    const search = _.debounce(() => {
      $scope.disp.isFiltering = true
      OneMapPlaceService.getAllResults($scope.data.searchInput).then(results => {
        $scope.disp.isFiltering = false
        if (results) {
          $scope.disp.results = results.results
        } else {
          $scope.disp.results = []
        }
        $scope.$digest()
      })
    }, 500)

    // ------------------------------------------------------------------------
    // stateParams
    // ------------------------------------------------------------------------
    let type = $stateParams.type
    let callback = $stateParams.callback
    let location = $stateParams.location

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    let defaultResults = null

    if (type === 'pickup') {
      defaultResults = [
        'Punggol MRT',
        'Jurong East MRT',
        'Sengkang MRT',
        'Tampines MRT',
        'Woodlands MRT',
        'Yishun MRT',
        'Bedok MRT',
      ]
    } else if (type === 'dropoff') {
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

    $scope.data = {
      searchInput: location ? location.ADDRESS : null,
    }

    $scope.disp = {
      results: null,
      type,
      placeholder: type === 'pickup' ? 'Pick Up Address' : 'Drop Off Address',
      isFiltering: !location,
    }

    $scope.data.defaultResults = defaultResults

    Promise.all(defaultResults.map(result => {
      return OneMapPlaceService.getAllResults(result).then(results => {
        if (results) {
          let location = results.results[0]
          location.ADDRESS = result
          return location
        }
      })
    })).then(results => {
      $scope.disp.isFiltering = false
      $scope.data.defaultResults = results
    })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    $scope.$watch('data.searchInput', input => {
      // if input is same as location, means we just entered and can search
      // straight away
      if (location && input === location.ADDRESS) {
        search()
        search.flush()
      } else if (!input || input.length < 3) {
        $scope.disp.results = null
      } else {
        search()
      }
    })

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.select = location => {
      $scope.data.selectedLocation = location
      if (typeof callback === 'function') {
        callback($scope.data.selectedLocation)
        $ionicHistory.goBack()
      }
    }

    $scope.clearInput = () => {
      $scope.data.searchInput = null
    }
  },
]
