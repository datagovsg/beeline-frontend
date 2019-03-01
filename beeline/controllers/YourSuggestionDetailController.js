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
    function initialiseLoadingCounter () {
      let now = new Date()
      let createdAt = new Date($scope.data.suggestion.createdAt)
      let timeSinceCreated = (now - createdAt) / 1000

      let maxWaitingTime = $scope.loadingBar.maxWaitingPercentage / $scope.loadingBar.counterProgress

      let counter
      // set counter based on time passed since suggestion was created
      if (timeSinceCreated > maxWaitingTime) {
        counter = $scope.loadingBar.maxWaitingPercentage
      } else {
        counter = timeSinceCreated * $scope.loadingBar.counterProgress
      }

      // if suggestion is more than 2 mins old, start counter from 0
      if (timeSinceCreated > 2 * 60) {
        return 0
      }

      return counter
    }

    function parseErrorMsg (msg) {
      if (msg === 'too_few_suggestions') {
        return 'We will need at least 15 other similar route suggestions to generate a crowdstart route for you.'
      }
      if (msg === 'no_routes_found') {
        return 'We are unable to generate a crowdstart route for you. Please contact us at feedback@beeline.sg.'
      }
      return 'Internal server error. Please try again later.'
    }

    function startTimer () {
      $scope.loadingBarTimer = setInterval(function () {
        // If user is still on the same page and route is stil being generated
        // after timer has reached 80%, pause the timer
        if (
          $scope.loadingBar.counter >= $scope.loadingBar.maxWaitingPercentage &&
            !$scope.data.suggestedRoute
        ) {
          $scope.$apply()
          return
        }

        $scope.loadingBar.counter += $scope.loadingBar.counterProgress
        $scope.$apply()
        if ($scope.loadingBar.counter > 100) {
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
      maxWaitingPercentage: 80,
      counterProgress: 5, // Percentage that counter progress per sec
    }
    $scope.loadingBar.counter = initialiseLoadingCounter()

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
      $scope.data.suggestedRoute = null
    })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    $scope.$watch('data.suggestedRoute', route => {
      if (route && route.info.status === 'Failure') {
        let msg = parseErrorMsg(route.info.reason)
        $ionicPopup.alert({
          title: 'We are sorry!',
          template: `
          <div>${msg}</div>
          `,
        })
      }
    })
    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.saveCrowdstartPreview = function (route) {
      CrowdstartService.setCrowdstartPreview(route)
      RoutesService.setRoutePreview(route)
    }

    $scope.popupDeleteConfirmation = function () {
      $ionicPopup.confirm({
        title: 'Are you sure you want to delete this suggestion?',
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
            let delay = 0

            // if result is returned too fast
            // simulate a 2 sec loading time for user
            if ($scope.loadingBar.counter < 2 * $scope.loadingBar.counterProgress) {
              delay = 2000
            }

            $timeout(() => {
              $scope.data.suggestedRoute = data
              $scope.data.isLoading = false
              clearInterval($scope.refreshSuggestedRoutesTimer)
              clearInterval($scope.loadingBarTimer)
              $scope.loadingBar.counter = 0
            }, delay)
          }
        })
        .catch(error => {
          $ionicPopup.alert({
            title: "Sorry there's been a problem loading the suggested route information",
            subTitle: error && error.data ? error.data : error,
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
          displaySuggestBtn: false,
        })
      }, 800)
    }
  },
]
