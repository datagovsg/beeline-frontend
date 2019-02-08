export default [
  '$scope',
  '$state',
  'SuggestionService',
  '$ionicLoading',
  function (
    // Angular Tools
    $scope,
    $state,
    SuggestionService,
    $ionicLoading
  ) {
    // ------------------------------------------------------------------------
    // Helper Functions
    // ------------------------------------------------------------------------

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    $scope.data = {
      suggestions: null,
    }

    // ------------------------------------------------------------------------
    // Ionic events
    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    $scope.$watch(() => SuggestionService.getSuggestions(), suggestions => {
      $scope.data.suggestions = suggestions
    })

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.viewSuggestionDetail = async function (suggestion) {
      $ionicLoading.show({
        template: `<ion-spinner icon='crescent'></ion-spinner><br/><small>Loading suggestion</small>`,
      })

      let suggestedRoute = await SuggestionService.fetchSuggestedRoute(suggestion.id)

      $ionicLoading.hide()
      $state.go('tabs.your-suggestion-detail', {
        suggestion,
        suggestedRoute,
        suggestionId: suggestion.id,
      })
    }
  },
]
