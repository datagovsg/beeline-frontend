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
  function (
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
    // stateParams
    // ------------------------------------------------------------------------
    // let routeId = $stateParams.routeId ? Number($stateParams.routeId) : null
    // let type = $stateParams.type
    // let stopId = $stateParams.stopId ? Number($stateParams.stopId) : null
    let callback = $stateParams.callback

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    $scope.data = {
      searchInput: '',
    }

    $scope.disp = {
      results: null,
    }

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    $scope.$watch('data.searchInput', input => {
      if (!input || input.length < 3) return

      OneMapPlaceService.getAllResults(input).then(results => {
        if (results) {
          $scope.disp.results = results.results
        }
      })
    })

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    // $ionicLoading.show({
    //   template: `<ion-spinner icon='crescent'></ion-spinner>\
    //     <br/><small>Loading stop information</small>`,
    // })

    $scope.select = location => {
      $scope.data.selectedLocation = location
      if (typeof callback === 'function') {
        callback($scope.data.selectedLocation)
        $ionicHistory.goBack()
      }
    }
  },
]
