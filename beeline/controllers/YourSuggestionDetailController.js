export default [
  '$scope',
  '$state',
  '$stateParams',
  '$ionicPopup',
  'loadingSpinner',
  'RoutesService',
  'SuggestionService',
  'CrowdstartService',
  '$ionicLoading',
  '$timeout',
  function (
    // Angular Tools
    $scope,
    $state,
    $stateParams,
    $ionicPopup,
    loadingSpinner,
    RoutesService,
    SuggestionService,
    CrowdstartService,
    $ionicLoading,
    $timeout
  ) {
    // ------------------------------------------------------------------------
    // Helper Functions
    // ------------------------------------------------------------------------
    $scope.parseErrorMsg = function (msg) {
      return msg.replace(/_/g, ' ') + '!'
    }

    function startTimer () {
      $scope.loadingBarTimer = setInterval(function () {
        // If user is still on the same page and route is stil being generated
        // after timer has reached 80%, pause the timer
        if (
          $scope.loadingBar.counter / $scope.loadingBar.timer >= 0.8 &&
            !$scope.data.suggestedRoute
        ) {
          $scope.$apply()
          return
        }

        $scope.loadingBar.counter++
        $scope.$apply()
        if ($scope.loadingBar.counter > $scope.loadingBar.timer) {
          clearInterval($scope.loadingBarTimer)
        }
      }, 1000)
    }
    // ------------------------------------------------------------------------
    // stateParams
    // ------------------------------------------------------------------------
    let suggestionId = $stateParams.suggestionId ? Number($stateParams.suggestionId) : null

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    $scope.data = {
      suggestionId: suggestionId,
      suggestion: $stateParams.suggestion,
      suggestedRoute: $stateParams.suggestedRoute,
      isLoading: false,
    }
    $scope.refreshSuggestedRoutesTimer = null
    $scope.loadingBarTimer = null

    $scope.loadingBar = {
      timer: 20,
    }

    let now = new Date()
    let createdAt = new Date($scope.data.suggestion.createdAt)
    // set counter based on time passed since suggestion was created
    $scope.loadingBar.counter = now - createdAt > 0.8 * $scope.loadingBar.timer * 1000
      ? $scope.loadingBar.counter = 0.8 * $scope.loadingBar.timer
      : (now - createdAt) / 1000

    // ------------------------------------------------------------------------
    // Ionic events
    // ------------------------------------------------------------------------
    // Load the route information
    // Show a loading overlay while we wait
    // force reload when revisit the same route
    $scope.$on('$ionicView.beforeEnter', () => {
      if (!$scope.data.suggestedRoute) {
        $scope.data.isLoading = true
        startTimer()
        $scope.refreshSuggestedRoutes(suggestionId)
      }
    })

    $scope.$on('$ionicView.leave', () => {
      clearInterval($scope.refreshSuggestedRoutesTimer)
      clearInterval($scope.loadingBarTimer)
    })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
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
      SuggestionService.fetchSuggestedRoute(suggestionId)
        .then(data => {
          if (!data) {
            $scope.refreshSuggestedRoutesTimer = setTimeout(() => $scope.refreshSuggestedRoutes(suggestionId), 5000)
          } else {
            $scope.data.suggestedRoute = data
            $scope.data.isLoading = false

            let now = new Date()
            let createdAt = new Date($scope.data.suggestion.createdAt)
            // If suggestion is more than one month old AND no suggested routes found,
            // trigger route generation again
            if (now - createdAt > 30 * 24 * 3600e3 && data.info.status === 'Failure') {
              SuggestionService.triggerRouteGeneration(suggestionId)
            }
          }
        })
        .catch(error => {
          $ionicPopup.alert({
            title: "Sorry there's been a problem loading the suggested route information",
            subTitle: error,
          })
        })
    }

    $scope.showSimilarRoutes = function () {
      let pickUp = $scope.data.suggestion.boardDescription.oneMapData
      let dropOff = $scope.data.suggestion.alightDescription.oneMapData

      $ionicLoading.show({
        template: `<ion-spinner icon='crescent'></ion-spinner><br/><small>Searching for routes</small>`,
      })

      $timeout(() => {
        $ionicLoading.hide()
        $state.go('tabs.routes-search-list', {
          pickUpLocation: pickUp,
          dropOffLocation: dropOff,
        })
      }, 800)
    }
  },
]
