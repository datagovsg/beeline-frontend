import _ from 'lodash'
import moment from 'moment'

export default [
  '$scope',
  '$state',
  '$stateParams',
  '$ionicPopup',
  '$ionicLoading',
  'loadingSpinner',
  'UserService',
  'SuggestionService',
  function (
    // Angular Tools
    $scope,
    $state,
    $stateParams,
    $ionicPopup,
    $ionicLoading,
    loadingSpinner,
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
    $scope.$on('$ionicView.afterEnter', () => {
      $ionicLoading.show({
        template: `<ion-spinner icon='crescent'></ion-spinner><br/><small>Loading route information</small>`,
      })

      SuggestionService.getSuggestion(suggestionId)
        .then(response => {
          $scope.data.suggestion = response.details
          $ionicLoading.hide()
        })
        .catch(error => {
          $ionicLoading.hide()
          $ionicPopup.alert({
            title: "Sorry there's been a problem loading the suggested route information",
            subTitle: error
          })
        })
    })

    $scope.$on('$ionicView.leave', () => {
      $scope.data.suggestionId = null
      $scope.data.suggestion = null
    })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------  
    $scope.popupDeleteConfirmation = function () {
      $ionicPopup.confirm({
        title: 'Are you sure you want to delete the suggestions?'
      }).then(async (proceed) => {
        if (proceed) {
          try {
            const data = await loadingSpinner(
              SuggestionService.deleteSuggestion(suggestionId)
            )
            $state.go('tabs.your-suggestions')
          } catch (err) {
            await $ionicPopup.alert({
              title: 'Error deleting suggestion',
              template: `
              <div> There was an error deleting the suggestion. \
              ${err && err.data && err.data.message} Please try again later.</div>
              `,
            })
          }
        }
      })
    }
  },
]
