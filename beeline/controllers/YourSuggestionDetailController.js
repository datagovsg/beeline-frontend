export default [
  '$scope',
  '$state',
  '$stateParams',
  '$ionicPopup',
  '$ionicLoading',
  'loadingSpinner',
  'RoutesService',
  'SuggestionService',
  'CrowdstartService',
  function (
    // Angular Tools
    $scope,
    $state,
    $stateParams,
    $ionicPopup,
    $ionicLoading,
    loadingSpinner,
    RoutesService,
    SuggestionService,
    CrowdstartService
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
      suggestion: null,
      routes: null,
    }

    $scope.loadingBar = {
      timer: 20,
      counter: 0,
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
        })
        .catch(error => {
          $ionicLoading.hide()
          $ionicPopup.alert({
            title: "Sorry there's been a problem loading the suggested route information",
            subTitle: error,
          })
        })

      $scope.refreshSuggestedRoutes(suggestionId)

      // Update the count down every 1 second
      let timer = setInterval(function () {
        $scope.loadingBar.counter++
        $scope.$apply()

        // If the count down is finished, write some text
        if ($scope.loadingBar.counter > $scope.loadingBar.timer) {
          clearInterval(timer)
        }
      }, 1000)
    })

    $scope.$on('$ionicView.leave', () => {
      $scope.data.suggestionId = null
      $scope.data.suggestion = null
      $scope.data.routes = null
    })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    $scope.$watchGroup(
      ['data.suggestion', 'data.routes'],
      ([suggestion, routes]) => {
        if (suggestion && routes) {
          $ionicLoading.hide()
        }
      }
    )

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.saveCrowdstartPreview = function (route) {
      CrowdstartService.setCrowdstartPreview(route)
      RoutesService.setRoutePreview(route)
    }

    $scope.popupDeleteConfirmation = function () {
      $ionicPopup.confirm({
        title: 'Are you sure you want to delete the suggestions?',
      }).then(async (proceed) => {
        if (proceed) {
          try {
            await loadingSpinner(
              SuggestionService.deleteSuggestion(suggestionId)
            )
            $state.go('tabs.your-suggestions')
            $scope.refreshSuggestions()
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

    $scope.refreshSuggestions = async function () {
      await loadingSpinner(SuggestionService.fetchSuggestions())
    }

    $scope.refreshSuggestedRoutes = function (suggestionId) {
      SuggestionService.fetchSuggestedRoutes(suggestionId)
        .then(data => {
          if (!data.done) {
            setTimeout(() => $scope.refreshSuggestedRoutes(suggestionId), 5000)
          } else {
            $scope.data.routes = data.routes
          }
        })
        .catch(error => {
          $ionicLoading.hide()
          $ionicPopup.alert({
            title: "Sorry there's been a problem loading the suggested route information",
            subTitle: error,
          })
        })
    }
  },
]
