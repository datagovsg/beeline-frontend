import _ from 'lodash'
const moment = require('moment')

export default [
  '$scope',
  '$state',
  '$stateParams',
  '$timeout',
  'loadingSpinner',
  'UserService',
  '$ionicPopup',
  '$ionicLoading',
  'CrowdstartService',
  'CompanyService',
  'StripeService',
  'SuggestionService',
  function (
    $scope,
    $state,
    $stateParams,
    $timeout,
    loadingSpinner,
    UserService,
    $ionicPopup,
    $ionicLoading,
    CrowdstartService,
    CompanyService,
    StripeService,
    SuggestionService
  ) {
    // ------------------------------------------------------------------------
    // stateParams
    // ------------------------------------------------------------------------
    let routeId = $stateParams.routeId ? Number($stateParams.routeId) : null
    routeId = $stateParams.routeId === 'preview' ? $stateParams.routeId : routeId
    let bidPrice = $stateParams.bidPrice ? Number($stateParams.bidPrice) : null
    let bidded = $stateParams.bidded ? Boolean($stateParams.bidded) : null

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    // Default settings for various info used in the page
    $scope.book = {
      routeId: null,
      boardStopId: null,
      alightStopId: null,
      route: null,
      notExpired: true,
      isBid: null,
    }
    $scope.priceInfo = {
      tripCount: null,
      bidPrice: null,
      totalDue: null,
    }
    $scope.data = {
      hasCreditInfo: false,
      brand: null,
      last4Digits: null,
    }
    $scope.disp = {
      bidded,
    }

    $scope.book.routeId = routeId
    $scope.priceInfo.bidPrice = bidPrice

    // Load the route information
    // Show a loading overlay while we wait
    // force reload when revisit the same route
    $scope.$on('$ionicView.afterEnter', () => {
      $ionicLoading.show({
        template: `<ion-spinner icon='crescent'></ion-spinner><br/><small>Loading route information</small>`,
      })

      CrowdstartService.fetchCrowdstartById(routeId)
        .then(route => {
          if (!route) return
          $scope.book.route = route

          // Add expiry date to route
          $scope.book.route.expiryDate = moment($scope.book.route.trips[0].date)
            .add(1, 'months')
            .format()

          // give 1st and last stop as board and alight stop for fake ticket
          $scope.book.boardStopId = _.first(route.trips[0].tripStops).id
          $scope.book.alightStopId = _.last(route.trips[0].tripStops).id
          $scope.priceInfo.tripCount = $scope.book.route.notes.noPasses || 0
          $scope.priceInfo.totalDue =
            $scope.priceInfo.bidPrice * $scope.priceInfo.tripCount
          $scope.$watch('priceInfo.bidPrice', price => {
            $scope.priceInfo.tripCount = $scope.book.route.notes.noPasses || 0
            $scope.priceInfo.totalDue = price * $scope.priceInfo.tripCount
          })
        })
        .then(() => $ionicLoading.hide())
        .catch(error => {
          $ionicLoading.hide()
          $ionicPopup.alert({
            title: "Sorry there's been a problem loading the route information",
            subTitle: error,
          })
        })
    })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------

    $scope.$watch(
      () => UserService.getUser(),
      async user => {
        $scope.isLoggedIn = Boolean(user)
        $scope.user = user
        if ($scope.isLoggedIn) {
          $scope.$watch(
            () => UserService.getUser().savedPaymentInfo,
            paymentInfo => {
              $scope.data.hasCreditInfo =
                $scope.user &&
                $scope.user.savedPaymentInfo &&
                $scope.user.savedPaymentInfo.sources.data.length > 0

              if ($scope.data.hasCreditInfo) {
                $scope.data.brand = paymentInfo.sources.data[0].brand
                $scope.data.last4Digits = paymentInfo.sources.data[0].last4
              }
            }
          )
        }
      }
    )

    // Figure out if user has bidded on this crowdstart route
    $scope.$watchGroup(
      [
        () => UserService.getUser(),
        () => CrowdstartService.getCrowdstartById($scope.book.routeId),
      ],
      async ([user, routePromise]) => {
        const route = await routePromise
        if (!user || !route) return

        // Figure out if user has bidded on this crowdstart route
        let userIds = route.bids && route.bids.map(bid => bid.userId)
        $scope.disp.bidded = userIds && userIds.includes(user.id)
      }
    )

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.showTerms = async () => {
      if (!$scope.book.route.transportCompanyId) return
      await CompanyService.showTerms($scope.book.route.transportCompanyId)
    }

    $scope.login = function () {
      UserService.promptLogIn()
    }

    $scope.createBid = async function () {
      try {
        // disable the button
        $scope.waitingForPaymentResult = true

        if (!$scope.data.hasCreditInfo) {
          const stripeToken = await StripeService.promptForToken(
            null,
            null,
            true
          )

          if (!stripeToken) return

          await loadingSpinner(UserService.savePaymentInfo(stripeToken.id))
        }
      } catch (err) {
        console.error(err)
        throw new Error(
          `Error saving credit card details. ${_.get(err, 'data.message')}`
        )
      } finally {
        $scope.waitingForPaymentResult = false
        // to make $digest not throw errors
        await new Promise(resolve => $timeout(resolve, 0))
        $scope.$digest()
      }

      try {
        if (routeId === 'preview') {
          await loadingSpinner(
            SuggestionService.convertToCrowdstart(
              $scope.book.route.suggestionId,
              $scope.book.route.suggestedRouteId
            )
          )
        } else {
          const bidPrice = $scope.priceInfo.bidPrice
          await loadingSpinner(
            CrowdstartService.createBid(
              $scope.book.route,
              $scope.book.boardStopId,
              $scope.book.alightStopId,
              bidPrice
            )
          )
        }

        await $ionicPopup.alert({
          title:
            'You have successfully joined the crowdstart route. We will inform you once your route is activated.',
        })
        $scope.$apply(() => {
          $scope.book.isBid = true
        })
        $state.go('tabs.yourRoutes')
      } catch (err) {
        await $ionicPopup.alert({
          title: 'Error processing bid',
          template: `
          <div> There was an error creating the bid. \
          ${err && err.data && err.data.message} Please try again later.</div>
          `,
        })
        $state.go('tabs.routes')
      } finally {
        $scope.waitingForPaymentResult = false
        $scope.$digest()
      }
    }

    // update the saving card info then place bid
    $scope.updateSavingCard = async function () {
      try {
        const stripeToken = await StripeService.promptForToken(null, null, true)

        if (!stripeToken) return

        await loadingSpinner(UserService.updatePaymentInfo(stripeToken.id))
      } catch (error) {
        console.error(error)
        throw new Error(
          `Error saving credit card details. ${_.get(error, 'data.message')}`
        )
      }
    }

    // Popup to confirm withdrawal from crowdstart
    $scope.popupWithdraw = async function () {
      if (!$scope.disp.bidded) {
        await $ionicPopup.alert({
          title: 'Error withdrawing from route',
          template: `
          <div> You do not have an active bid for this route.</div>
          `,
        })
        return
      }

      const response = await $ionicPopup.confirm({
        title: 'Are you sure you want to withdraw?',
      })

      if (!response) return

      try {
        let response = await CrowdstartService.deleteBid($scope.book.route)

        // If not withdrawn, means failed
        if (response.status !== 'withdrawn') {
          await $ionicPopup.alert({
            title: 'Error withdrawing from route',
            template: `
            <div> There was an error withdrawing from the route. Please try again later.</div>
            `,
          })
        } else {
          await $ionicPopup.alert({
            title:
              'The pre-order of your route pass has been withdrawn. No charges will be made to your card.',
          })
          $state.go('tabs.routes')
        }
      } catch (err) {
        await $ionicPopup.alert({
          title: 'Error withdrawing from route',
          template: `
          <div> There was an error withdrawing from the route. \
          ${err && err.data && err.data.message} Please try again later.</div>
          `,
        })
      }
    }
  },
]
