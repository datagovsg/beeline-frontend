import _ from 'lodash'
import moment from 'moment'

export default [
  '$scope',
  '$stateParams',
  '$ionicPopup',
  '$ionicLoading',
  'UserService',
  'SuggestionService',
  function (
    // Angular Tools
    $scope,
    $stateParams,
    $ionicPopup,
    $ionicLoading,
    UserService,
    SuggestionService,
  ) {
    // ------------------------------------------------------------------------
    // Helper Functions
    // ------------------------------------------------------------------------

    // ------------------------------------------------------------------------
    // stateParams
    // ------------------------------------------------------------------------
    let suggestionId = $stateParams.suggestionId ? Number($stateParams.suggestionId) : null

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    $scope.data = {
      suggestionId: suggestionId,
      suggestion: null
    }

    // ------------------------------------------------------------------------
    // Ionic events
    // ------------------------------------------------------------------------
    // Load the route information
    // Show a loading overlay while we wait
    // force reload when revisit the same route
    // $scope.$on('$ionicView.afterEnter', () => {
    //   $ionicLoading.show({
    //     template: `<ion-spinner icon='crescent'></ion-spinner><br/><small>Loading route information</small>`,
    //   })

    //   SuggestionService.getSuggestion(suggestionId)
    //     .then(response => {
    //       $scope.data.suggestion = response.details
    //       $ionicLoading.hide()
    //     })
    //     .catch(error => {
    //       $ionicLoading.hide()
    //       $ionicPopup.alert({
    //         title: "Sorry there's been a problem loading the suggested route information",
    //         subTitle: error,
    //       })
    //     })
    // })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
  },
]
