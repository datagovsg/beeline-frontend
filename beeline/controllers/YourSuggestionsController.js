import _ from 'lodash'
import moment from 'moment'

export default [
  '$scope',
  'loadingSpinner',
  'SuggestionService',
  function (
    // Angular Tools
    $scope,
    loadingSpinner,
    SuggestionService
  ) {
    // ------------------------------------------------------------------------
    // Helper Functions
    // ------------------------------------------------------------------------

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    $scope.data = {
      suggestions: null
    }

    // ------------------------------------------------------------------------
    // Ionic events
    // ------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
      // Refresh suggestions on enter in case we added a new
      // suggestion or deleted a suggestion 
      $scope.refreshSuggestions()
    })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    $scope.$watch(() => SuggestionService.getSuggestions(), suggestions => {
      console.log('new suggestions')
      $scope.data.suggestions = suggestions
    })
    
    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.refreshSuggestions = async function () {
      console.log('fetch suggestions', $scope.data.suggestions)
      if (!$scope.data.suggestions) {
        return SuggestionService.fetchSuggestions()
      }
      console.log('fetch updated suggestions')
      await loadingSpinner(SuggestionService.fetchSuggestions())
    }
  },
]
