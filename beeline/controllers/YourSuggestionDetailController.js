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
    $scope.refreshSuggestedRoutesTimer = null
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
      SuggestionService.getSuggestion(suggestionId)
        .then(response => {
          $scope.data.suggestion = response.details

          let now = new Date()
          let createdAt = new Date($scope.data.suggestion.createdAt)
          // If user has exited detail page and route is stil being generated
          // after timer has ended, pause the timer at 80%
          if (now - createdAt > $scope.loadingBar.timer * 1000 && !$scope.data.routes) {
            $scope.loadingBar.counter = $scope.loadingBar.timer * 0.8
          } else {
            // Else continue timer
            $scope.loadingBar.counter = Math.floor((now - createdAt) / 1000)

            let timer = setInterval(function () {
              // If user is still on the same page and route is stil being generated
              // after timer has reached 80%, pause the timer
              if (
                $scope.loadingBar.counter / $scope.loadingBar.timer >= 0.8 &&
                  !$scope.data.routes
              ) {
                return
              }

              $scope.loadingBar.counter++
              $scope.$apply()
              if ($scope.loadingBar.counter > $scope.loadingBar.timer) {
                clearInterval(timer)
              }
            }, 1000)
          }
        })
        .catch(error => {
          $ionicPopup.alert({
            title: "Sorry there's been a problem loading the suggested route information",
            subTitle: error,
          })
        })

      $scope.refreshSuggestedRoutes(suggestionId)
    })

    $scope.$on('$ionicView.leave', () => {
      clearInterval($scope.refreshSuggestedRoutesTimer)
      $scope.data.suggestionId = null
      $scope.data.suggestion = null
      $scope.data.routes = null
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
      SuggestionService.fetchSuggestedRoutes(suggestionId)
        .then(data => {
          if (!data.done) {
            $scope.refreshSuggestedRoutesTimer = setTimeout(() => $scope.refreshSuggestedRoutes(suggestionId), 5000)
          } else {
            $scope.data.routes = data.routes

            let now = new Date()
            let createdAt = new Date($scope.data.suggestion.createdAt)
            // If suggestion is more than one month old AND no suggested routes found,
            // trigger route generation again
            if (now - createdAt > 30 * 24 * 3600e3 && data.routes.length === 0) {
              SuggestionService.triggerRouteGeneration(suggestionId)
              $scope.refreshSuggestedRoutes(suggestionId)
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
