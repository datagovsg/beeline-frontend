// import _ from "lodash"

import {
  formatDate,
  formatDateMMMdd,
  formatDateddMMMYYYY,
  formatTime,
  formatTimeArray,
  formatUTCDate,
  titleCase,
  formatHHMMampm,
} from './shared/format'
import { companyLogo, miniCompanyLogo } from './shared/imageSources'

// node imports
import compareVersions from 'compare-versions'
import assert from 'assert'

import 'multiple-date-picker/dist/multipleDatePicker'

// Configuration Imports
import configureRoutes from './router.js'

// Import app modules
import './common/main'

let app = angular.module('beeline', [
  'ionic',
  'ngCordova',
  'uiGmapgoogle-maps',
  'multipleDatePicker',
  'ngclipboard',
  'common',
  'angucomplete-alt',
])

require('angucomplete-alt')
require('angular-simple-logger')
require('angular-google-maps')
require('clipboard')
require('ngclipboard')

// Directives
require('./directives/autofocus')
require('./directives/beelineBindHtml')
require('./directives/companyTnc/companyTnc')
require('./directives/countdown')
require('./directives/crowdstartInfo/crowdstartInfo')
require('./directives/dailyTripsBroker')
require('./directives/extA')
require('./directives/liteRouteStop/liteRouteStop')
require('./directives/locationSearch/locationSearch')
require('./directives/mapBusIcon')
require('./directives/mapPolyRoute')
require('./directives/moreInfo/moreInfo')
require('./directives/myLocation')
require('./directives/poweredByBeeline/poweredByBeeline')
require('./directives/priceCalculator/priceCalculator')
require('./directives/progressBar/progressBar')
require('./directives/routeItem/animatedRoute')
require('./directives/routeItem/crowdstartRoute')
require('./directives/routeItem/liteRoute')
require('./directives/locationSelectModal/locationSelectModal')
require('./directives/routeItem/regularRoute')
require('./directives/routeItem/routeItem')
require('./directives/routePassExpiry/routePassExpiryModal')
require('./directives/routeShare')
require('./directives/searchInput')
require('./directives/touchStart')
require('./directives/tripCode/tripCode')
require('./directives/ticketDetailModal/ticketDetailModal')
require('./directives/companyInfoBroker')
require('./directives/menuHamburger')
require('./directives/routesList/routesList')
require('./directives/routesList/yourRoutesList')
require('./directives/suggestionItem/suggestionItem')

// Data Services
require('./services/data/CompanyService')
require('./services/data/CrowdstartService')
require('./services/data/LiteRoutesService')
require('./services/data/LiteRouteSubscriptionService')
require('./services/data/RoutesService')
require('./services/data/TicketService')
require('./services/data/TripService')
require('./services/data/SuggestionService')

// UI Services
require('./services/legalese')
require('./services/login')

// Services
require('./common/BookingService')
require('./services/fastCheckoutService')
require('./services/MapOptions')
require('./services/MapViewFactory')
require('./services/paymentService')
require('./services/StripeService')
require('./services/UserService')

// //////////////////////////////////////////////////////////////////////////////
// Angular configuration
// //////////////////////////////////////////////////////////////////////////////
app
  .filter('formatDate', () => formatDate)
  .filter('formatDateMMMdd', () => formatDateMMMdd)
  .filter('formatDateddMMMYYYY', () => formatDateddMMMYYYY)
  .filter('formatUTCDate', () => formatUTCDate)
  .filter('formatTime', () => formatTime)
  .filter('formatTimeArray', () => formatTimeArray)
  .filter('formatHHMMampm', () => formatHHMMampm)
  .filter('titleCase', () => titleCase)
  .filter('routeStartTime', () => route =>
    route && route.trips ? route.trips[0].tripStops[0].time : ''
  )
  .filter('routeEndTime', () => route =>
    route && route.trips
      ? route.trips[0].tripStops[route.trips[0].tripStops.length - 1].time
      : ''
  )
  .filter('routeStartRoad', () => route =>
    route && route.trips ? route.trips[0].tripStops[0].stop.road : ''
  )
  .filter('routeEndRoad', () => route =>
    route && route.trips
      ? route.trips[0].tripStops[route.trips[0].tripStops.length - 1].stop.road
      : ''
  )
  .filter('companyLogo', () => companyLogo)
  .filter('miniCompanyLogo', () => miniCompanyLogo)
  .filter('monthNames', function () {
    return function (i) {
      let monthNames = 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(
        ','
      )
      return monthNames[i]
    }
  })
  // round up a float number with optional precision
  .filter('floatRoundUp', function () {
    return function (number, precision) {
      if (!precision) precision = 2
      // 4.4 * (10 ^ 2) = 440.000000006
      // Math.ceil(440.000000006) = 441
      let temp = (number * Math.pow(10, precision)).toFixed(4)
      temp = Math.ceil(temp)
      return temp / Math.pow(10, precision)
    }
  })
  .controller(
    'IntroSlidesController',
    require('./controllers/IntroSlidesController.js').default
  )
  .controller(
    'RoutesListController',
    require('./controllers/RoutesListController.js').default
  )
  .controller(
    'RouteDetailController',
    require('./controllers/RouteDetailController.js').default
  )
  .controller(
    'RouteStopsController',
    require('./controllers/RouteStopsController.js').default
  )
  .controller(
    'BookingDatesController',
    require('./controllers/BookingDatesController.js').default
  )
  .controller(
    'BookingSummaryController',
    require('./controllers/BookingSummaryController.js').default
  )
  .controller(
    'BookingConfirmationController',
    require('./controllers/BookingConfirmationController.js').default
  )
  .controller(
    'SettingsController',
    require('./controllers/SettingsController.js').default
  )
  .controller(
    'TicketsController',
    require('./controllers/TicketsController.js').default
  )
  .controller(
    'BookingHistoryController',
    require('./controllers/BookingHistoryController.js').default
  )
  .controller(
    'LiteMoreInfoController',
    require('./controllers/LiteMoreInfoController.js').default
  )
  .controller(
    'CrowdstartDetailController',
    require('./controllers/CrowdstartDetailController.js').default
  )
  .controller(
    'CrowdstartSummaryController',
    require('./controllers/CrowdstartSummaryController.js').default
  )
  .controller(
    'TabsController',
    require('./controllers/TabsController.js').default
  )
  .controller(
    'MapViewController',
    require('./controllers/MapViewController.js').default
  )
  .controller(
    'RouteDetailMapViewController',
    require('./controllers/RouteDetailMapViewController.js').default
  )
  .controller(
    'LiteMapViewController',
    require('./controllers/LiteMapViewController.js').default
  )
  .controller(
    'LiteDetailController',
    require('./controllers/LiteDetailController.js').default
  )
  .controller(
    'CrowdstartStopsController',
    require('./controllers/CrowdstartStopsController.js').default
  )
  .controller(
    'PurchaseRoutePassController',
    require('./controllers/PurchaseRoutePassController.js').default
  )
  .controller(
    'YourSuggestionsController',
    require('./controllers/YourSuggestionsController.js').default
  )
  .controller(
    'YourSuggestionsCreateController',
    require('./controllers/YourSuggestionsCreateController.js').default
  )
  .controller(
    'YourSuggestionsDetailController',
    require('./controllers/YourSuggestionsDetailController.js').default
  )
  .config(configureRoutes)
  .config([
    '$locationProvider',
    function ($locationProvider) {
      // XXX: Here be dragons
      // Turn on html5Mode only if we are sure we are not a cordova app
      // Further, Ionic breaks if the root document has a base tag, and we
      // cannot use html5Mode({enabled:true, requireBase: false}) as that
      // breaks all the routes in the app
      // Instead, _dynamically inject_ a base tag into the root document when
      // we realise that we are not cordova, to keep both sides happy
      if (!window.cordova) {
        const base = window.document.createElement('base')
        base.setAttribute('href', '/')
        const [head] = window.document.getElementsByTagName('head')
        head.appendChild(base)
        // $locationProvider.html5Mode({ enabled: true })
      }
    },
  ])
  .config([
    '$ionicConfigProvider',
    function ($ionicConfigProvider) {
      $ionicConfigProvider.tabs.position('bottom')
      $ionicConfigProvider.tabs.style('standard')
      $ionicConfigProvider.navBar.alignTitle('center')
      $ionicConfigProvider.scrolling.jsScrolling(false)
      // crowdstart-summary use default history stack
      $ionicConfigProvider.backButton.previousTitleText(false).text(' ')
    },
  ])
  .config([
    '$httpProvider',
    function ($httpProvider) {
      $httpProvider.useApplyAsync(true)
    },
  ])
  .config([
    'uiGmapGoogleMapApiProvider',
    function (uiGmapGoogleMapApiProvider) {
      if (process.env.GOOGLE_API_KEY) {
        uiGmapGoogleMapApiProvider.configure({
          key: process.env.GOOGLE_API_KEY,
          libraries: 'places,geometry',
        })
      } else {
        uiGmapGoogleMapApiProvider.configure({
          client: 'gme-infocommunications',
          libraries: 'places,geometry',
        })
      }
    },
  ])
  .config([
    '$ionicConfigProvider',
    function ($ionicConfigProvider) {
      $ionicConfigProvider.views.transition('none')
    },
  ])
  .run([
    '$ionicPlatform',
    function ($ionicPlatform) {
      $ionicPlatform.ready(function () {
        if (typeof IonicDeeplink !== 'undefined') {
          IonicDeeplink.route(
            {}, // No predetermined matches
            function (match) {},
            function (nomatch) {
              window.location.href =
                '#' + (nomatch.$link.fragment || nomatch.$link.path)
            }
          )
        }
      })
    },
  ])
  .run([
    '$rootScope',
    'replace',
    'p',
    function ($rootScope, replace, p) {
      $rootScope.o = {
        ...p,
        replace,
      }
    },
  ])
  .run([
    '$ionicPlatform',
    function ($ionicPlatform) {
      $ionicPlatform.ready(function () {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (
          window.cordova &&
          window.cordova.plugins &&
          window.cordova.plugins.Keyboard
        ) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false)
          cordova.plugins.Keyboard.disableScroll(false)
        }
        if (window.StatusBar) {
          // org.apache.cordova.statusbar required
          if (device.platform === 'Android') {
            StatusBar.styleLightContent()
          } else if (device.platform === 'iOS') {
            StatusBar.styleDefault()
          }
        }
      })
    },
  ])
  .run([
    '$ionicPopup',
    function ($ionicPopup) {
      // Check that external dependencies have loaded
      if (
        typeof StripeCheckout === 'undefined' ||
        typeof Stripe === 'undefined'
      ) {
        document.addEventListener('online', () => {
          window.location.reload(true)
        })

        $ionicPopup
          .alert({
            title: 'Unable to connect to the Internet',
            template: `Please check your Internet connection`,
          })
          .then(() => {
            window.location.reload(true)
          })
      }
    },
  ])
  .run([
    '$rootScope',
    '$ionicTabsDelegate',
    function ($rootScope, $ionicTabsDelegate) {
      // hide/show tabs bar depending on how the route is configured
      $rootScope.$on('$stateChangeSuccess', function (
        event,
        toState,
        toParams,
        fromState,
        fromParams
      ) {
        if (toState.data && toState.data.hideTabs) {
          $ionicTabsDelegate.showBar(false)
        } else {
          $ionicTabsDelegate.showBar(true)
        }
      })
    },
  ])
  .run([
    'RoutesService',
    'CrowdstartService',
    'LiteRoutesService',
    'TicketService',
    'SuggestionService',
    function (
      RoutesService,
      CrowdstartService,
      LiteRoutesService,
      TicketService,
      SuggestionService
    ) {
      // Pre-fetch the routes
      RoutesService.fetchRoutes()
      RoutesService.fetchRecentRoutes()
      CrowdstartService.fetchCrowdstart()
      CrowdstartService.fetchBids()
      LiteRoutesService.fetchLiteRoutes()
      TicketService.fetchTickets()
    },
  ])
  .run([
    '$templateCache',
    function ($templateCache) {
      $templateCache.put(
        'templates/intro-slides.html',
        require('../www/templates/intro-slides.html')
      )
      $templateCache.put(
        'templates/settings.html',
        require('../www/templates/settings.html')
      )
      $templateCache.put(
        'templates/routes-list.html',
        require('../www/templates/routes-list.html')
      )
      $templateCache.put(
        'templates/tickets.html',
        require('../www/templates/tickets.html')
      )
      $templateCache.put(
        'templates/tab-booking-dates.html',
        require('../www/templates/tab-booking-dates.html')
      )
      $templateCache.put(
        'templates/tab-booking-summary.html',
        require('../www/templates/tab-booking-summary.html')
      )
      $templateCache.put(
        'templates/tab-booking-confirmation.html',
        require('../www/templates/tab-booking-confirmation.html')
      )
    },
  ])

let devicePromise = new Promise((resolve, reject) => {
  if (window.cordova) {
    document.addEventListener('deviceready', resolve, false)
  } else {
    console.warn('No cordova detected')
    resolve()
  }
})

app.service('DevicePromise', () => devicePromise)

app.run([
  'RequestService',
  '$ionicPopup',
  async function (RequestService, $ionicPopup) {
    // Version check, if we're in an app
    if (!window.cordova) {
      return
    }

    await devicePromise

    assert(window.cordova.InAppBrowser)
    assert(window.cordova.getAppVersion)
    assert(window.device)

    let versionNumberPromise = cordova.getAppVersion.getVersionNumber()

    let versionRequirementsPromise = RequestService.beeline({
      method: 'GET',
      url: '/versionRequirements',
    })

    let [versionNumber, versionRequirementsResponse] = await Promise.all([
      versionNumberPromise,
      versionRequirementsPromise,
    ])

    let appRequirements = versionRequirementsResponse.data.commuterApp
    assert(appRequirements)

    while (compareVersions(versionNumber, appRequirements.minVersion) < 0) {
      await $ionicPopup.alert({
        title: 'Update required',
        template: `Your version of the app is too old. Please visit the app
      store to upgrade your app.`,
      })

      if (appRequirements.upgradeUrl) {
        cordova.InAppBrowser.open(
          appRequirements.upgradeUrl[device.platform],
          '_system'
        )
      }
    }
  },
])
