import {formatDate, formatDateMMMdd, formatTime, formatTimeArray,
        formatUTCDate, titleCase} from './shared/format';
import {companyLogo} from './shared/imageSources';

global.moment = require('moment')

// node imports
import compareVersions from 'compare-versions';
import assert from 'assert';

// Angular imports
import AngularGoogleMap from 'angular-google-maps';
import MultipleDatePicker from 'multiple-date-picker/dist/multipleDatePicker';

// Configuration Imports
import configureRoutes from './router.js';

require('./directives/extA');

// //////////////////////////////////////////////////////////////////////////////
// Angular configuration
// //////////////////////////////////////////////////////////////////////////////
angular.module('beeline')
.filter('formatDate', () => formatDate)
.filter('formatDateMMMdd', () => formatDateMMMdd)
.filter('formatUTCDate', () => formatUTCDate)
.filter('formatTime', () => formatTime)
.filter('formatTimeArray', () => formatTimeArray)
.filter('formatHHMM_ampm', () => formatHHMM_ampm)
.filter('titleCase', () => titleCase)
.filter('routeStartTime', () => (route) => (route && route.trips) ? route.trips[0].tripStops[0].time : '')
.filter('routeEndTime', () => (route) => (route && route.trips) ? route.trips[0].tripStops[route.trips[0].tripStops.length - 1].time : '')
.filter('routeStartRoad', () => (route) => (route && route.trips) ? route.trips[0].tripStops[0].stop.road : '')
.filter('routeEndRoad', () => (route) => (route && route.trips) ? route.trips[0].tripStops[route.trips[0].tripStops.length - 1].stop.road : '')
.filter('companyLogo', () => companyLogo)
.filter('monthNames', function() {
  return function(i) {
    monthNames = 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(',');
    return monthNames[i];
  };
})
.factory('TicketService', require('./services/TicketService.js').default)
.factory('LiteRouteSubscriptionService', require('./services/LiteRouteSubscriptionService.js').default)
.factory('UserService', require('./services/UserService.js').default)
.factory('TripService', require('./services/TripService.js').default)
.factory('CompanyService', require('./services/CompanyService.js').default)
.factory('SuggestionService', require('./services/SuggestionService.js').default)
.factory('RoutesService', require('./services/RoutesService.js').default)
.factory('CreditsService', require('./services/CreditsService.js').default)
.service('LiteRoutesService', require('./services/LiteRoutesService.js').default)
.service('BookingService', require('./services/BookingService.js').default)
.factory('OneMapService', require('./services/OneMapService.js').default)
.factory('DateService', require('./services/DateService.js').default)
.factory('StripeService', require('./services/StripeService.js').default)
.factory('loadingSpinner', require('./services/LoadingSpinner.js').default)
.factory('GoogleAnalytics', require('./services/GoogleAnalytics.js').default)
.factory('SearchService', require('./services/SearchService.js').default)
.service('MapOptions', require('./services/MapOptions').default)
.service('busStopSelectorDialog', require('./services/busStopSelectorDialog.js').default)
.service('Legalese', require('./services/legalese.js').default)
.service('LoginDialog', require('./services/login.js').default)
.service('KickstarterService', require('./services/KickstarterService.js').default)
.controller('IntroSlidesController', require('./controllers/IntroSlidesController.js').default)
.controller('RoutesListController', require('./controllers/RoutesListController.js').default)
.controller('BookingStopsController', require('./controllers/BookingStopsController.js').default)
.controller('BookingDatesController', require('./controllers/BookingDatesController.js').default)
.controller('BookingSummaryController', require('./controllers/BookingSummaryController.js').default)
.controller('BookingConfirmationController', require('./controllers/BookingConfirmationController.js').default)
.controller('SuggestController', require('./controllers/SuggestController.js').default)
.controller('SettingsController', require('./controllers/SettingsController.js').default)
.controller('TicketsController', require('./controllers/TicketsController.js').default)
.controller('TicketDetailController', require('./controllers/TicketDetailController.js').default)
.controller('LiteRouteTrackerController', require('./controllers/LiteRouteTrackerController.js').default)
.controller('BookingHistoryController', require('./controllers/BookingHistoryController.js').default)
.controller('LiteSummaryController', require('./controllers/LiteSummaryController.js').default)
.controller('LiteMoreInfoController', require('./controllers/LiteMoreInfoController.js').default)
.controller('WelcomeController', require('./controllers/WelcomeController.js').default)
.controller('KickstarterController', require('./controllers/KickstarterController.js').default)
.controller('KickstarterDetailController', require('./controllers/KickstarterDetailController.js').default)
.controller('KickstarterSummaryController', require('./controllers/KickstarterSummaryController.js').default)
.controller('KickstarterCommitController', require('./controllers/KickstarterCommitController.js').default)
.controller('KickstarterRecapController', require('./controllers/KickstarterRecapController.js').default)
.controller('SearchController', require('./controllers/SearchController.js').default)
.controller('SearchResultsController', require('./controllers/SearchResultsController.js').default)
.directive('searchButton', require('./directives/searchButton.js').default)
.directive('suggestionViewer', require('./directives/suggestionViewer/suggestionViewer').default)
.directive('startEndPicker', require('./directives/startEndPicker/startEndPicker').default)
.directive('busStopSelector', require('./directives/busStopSelector/busStopSelector').default)
.directive('priceCalculator', require('./directives/priceCalculator/priceCalculator').default)
.directive('revGeocode', require('./directives/revGeocode/revGeocode').default)
.directive('fancyPrice', require('./directives/fancyPrice/fancyPrice').default)
.directive('bookingBreadcrumbs', require('./directives/bookingBreadcrumbs/bookingBreadcrumbs').default)
.directive('routeItem', require('./directives/routeItem/routeItem.js').default)
.directive('companyTnc', require('./directives/companyTnc/companyTnc.js').default)
.directive('tripCode', require('./directives/tripCode/tripCode.js').default)
.directive('myLocation', require('./directives/myLocation.js').default)
.directive('companyInfoBroker', require('./directives/companyInfoBroker.js').default)
.directive('moreInfo', require('./directives/moreInfo/moreInfo').default)
.directive('markdownRenderer', require('./directives/markdownRenderer').default)
.directive('mapPolyRoute', require('./directives/mapPolyRoute').default)
.directive('mapBusPolyRoute', require('./directives/mapBusPolyRoute').default)
.directive('mapBusStops', require('./directives/mapBusStops').default)
.directive('dynamicSignage', require('./directives/dynamicSignage.js').default)
.directive('beelineBindHtml', require('./directives/beelineBindHtml.js').default)
.directive('kickstartInfo', require('./directives/kickstartInfo/kickstartInfo.js').default)
.directive('progressBar', require('./directives/progressBar/progressBar.js').default)
.directive('dailyTripsBroker', require('./directives/dailyTripsBroker.js').default)
.directive('fakeProgressBar', require('./directives/fakeProgressBar.js').default)
.directive('inServiceWindow', require('./directives/inServiceWindow.js').default)
.directive('crowdstartShare', require('./directives/crowdstartShare.js').default)
.directive('poweredByBeeline', require('./directives/poweredByBeeline/poweredByBeeline.js').default)
.directive('gmapAutocomplete', require('./directives/autocomplete.js').default)
.directive('regularRoute', require('./directives/routeItem/regularRoute.js').default)
.directive('kickstartRoute', require('./directives/routeItem/kickstartRoute.js').default)
.directive('liteRoute', require('./directives/routeItem/liteRoute.js').default)
.config(configureRoutes)
.config(function($ionicConfigProvider) {
  $ionicConfigProvider.tabs.position('bottom');
  $ionicConfigProvider.tabs.style('standard');
  $ionicConfigProvider.navBar.alignTitle('center');
  $ionicConfigProvider.scrolling.jsScrolling(false);
  //kickstart-summary use default history stack
  $ionicConfigProvider.backButton.previousTitleText(false).text(' ');
})
.config(function ($httpProvider) {
  $httpProvider.useApplyAsync(true);
})
.config(function(uiGmapGoogleMapApiProvider) {
  uiGmapGoogleMapApiProvider.configure({
    client: 'gme-infocommunications',
//        v: ', //defaults to latest 3.X anyhow
    libraries: 'places,geometry'
  });
})
.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
      cordova.plugins.Keyboard.disableScroll(false);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }
  });
})
.run(function($ionicPopup) {
  // Check that external dependencies have loaded
  if (typeof StripeCheckout === 'undefined'
    || typeof Stripe === 'undefined') {

      document.addEventListener('online', () => {
        window.location.reload(true);
      })


      $ionicPopup.alert({
        title: 'Unable to connect to the Internet',
        template: `Please check your Internet connection`
      })
      .then(() => {
        window.location.reload(true);
      })
  }
})
.run(function($rootScope, $ionicTabsDelegate) {
  // hide/show tabs bar depending on how the route is configured
  $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
    if (toState.data && toState.data.hideTabs) {
      $ionicTabsDelegate.showBar(false);
    }
    else {
      $ionicTabsDelegate.showBar(true);
    }
  });
})
.run(function (RoutesService, KickstarterService, LiteRoutesService) {
  // Pre-fetch the routes
  RoutesService.fetchRoutes();
  RoutesService.fetchRecentRoutes();
  KickstarterService.fetchLelong();
  KickstarterService.fetchBids();
  LiteRoutesService.fetchLiteRoutes();
})
.run(function ($templateCache) {
  $templateCache.put('templates/intro-slides.html', require('../www/templates/intro-slides.html'))
  $templateCache.put('templates/settings.html', require('../www/templates/settings.html'))
  $templateCache.put('templates/routes-list.html', require('../www/templates/routes-list.html'))
  $templateCache.put('templates/tickets.html', require('../www/templates/tickets.html'))
  $templateCache.put('templates/ticket-detail.html', require('../www/templates/ticket-detail.html'))
  $templateCache.put('templates/tab-booking-stops.html', require('../www/templates/tab-booking-stops.html'))
  $templateCache.put('templates/tab-booking-dates.html', require('../www/templates/tab-booking-dates.html'))
  $templateCache.put('templates/tab-booking-summary.html', require('../www/templates/tab-booking-summary.html'))
  $templateCache.put('templates/tab-booking-confirmation.html', require('../www/templates/tab-booking-confirmation.html'))
})

var devicePromise = new Promise((resolve, reject) => {
  if (window.cordova) {
    document.addEventListener('deviceready', resolve, false);
  }
  else {
    console.log('No cordova detected')
    resolve();
  }
})

app.service('DevicePromise', () => devicePromise);

app.run(['UserService', '$ionicPopup', async function (UserService, $ionicPopup) {
  // Version check, if we're in an app
  if (!window.cordova)
    return;

  await devicePromise;

  assert(window.cordova.InAppBrowser);
  assert(window.cordova.getAppVersion);
  assert(window.device);

  var versionNumberPromise = cordova.getAppVersion.getVersionNumber();

  var versionRequirementsPromise = UserService.beeline({
    method: 'GET',
    url: '/versionRequirements',
  })

  var [versionNumber, versionRequirementsResponse] = await Promise.all([
    versionNumberPromise, versionRequirementsPromise
  ]);

  var appRequirements = versionRequirementsResponse.data.commuterApp;
  assert(appRequirements);

  if (compareVersions(versionNumber, appRequirements.minVersion) < 0) {
    while (true) {
      await $ionicPopup.alert({
        title: 'Update required',
        template: `Your version of the app is too old. Please visit the app
        store to upgrade your app.`,
      })

      if (appRequirements.upgradeUrl) {
        cordova.InAppBrowser.open(appRequirements.upgradeUrl[device.platform], '_system');
      }
    }
  }
}])
