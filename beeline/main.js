import {formatDate, formatDateMMMdd, formatTime,
        formatUTCDate, titleCase} from './shared/format';
import {companyLogo} from './shared/imageSources';

// Directive Imports
import {DatePicker, TouchStart, TouchEnd, TouchMove, MouseMove} from './directives/datePicker/datePicker';

global.moment = require('moment')

// Configuration Imports
import configureRoutes from './router.js';
import AngularGoogleMap from 'angular-google-maps';
import MultipleDatePicker from 'multiple-date-picker/multipleDatePicker';

// //////////////////////////////////////////////////////////////////////////////
// Angular configuration
// //////////////////////////////////////////////////////////////////////////////
var app = angular.module('beeline', [
  'ionic',
  'ngCordova',
  'uiGmapgoogle-maps',
  'multipleDatePicker',
])
.constant('SERVER_URL', 'http://staging.beeline.sg')
.filter('formatDate', () => formatDate)
.filter('formatDateMMMdd', () => formatDateMMMdd)
.filter('formatUTCDate', () => formatUTCDate)
.filter('formatTime', () => formatTime)
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
.factory('UserService', require('./services/UserService.js').default)
.factory('TripService', require('./services/TripService.js').default)
.factory('CompanyService', require('./services/CompanyService.js').default)
.factory('SuggestionService', require('./services/SuggestionService.js').default)
.factory('RoutesService', require('./services/RoutesService.js').default)
.service('BookingService', require('./services/BookingService.js').default)
.factory('OneMapService', require('./services/OneMapService.js').default)
.factory('DateService', require('./services/DateService.js').default)
.factory('StripeService', require('./services/StripeService.js').default)
.service('MapOptions', require('./services/MapOptions').default)
.controller('IntroSlidesController', require('./controllers/IntroSlidesController.js').default)
.controller('RoutesController', require('./controllers/RoutesController.js').default)
.controller('RoutesMapController', require('./controllers/RoutesMapController.js').default)
.controller('RoutesListController', require('./controllers/RoutesListController.js').default)
.controller('RoutesResultsController', require('./controllers/RoutesResultsController.js').default)
.controller('BookingStopsController', require('./controllers/BookingStopsController.js').default)
.controller('BookingDatesController', require('./controllers/BookingDatesController.js').default)
.controller('BookingSummaryController', require('./controllers/BookingSummaryController.js').default)
.controller('BookingConfirmationController', require('./controllers/BookingConfirmationController.js').default)
.controller('SuggestController', require('./controllers/SuggestController.js').default)
.controller('SettingsController', require('./controllers/SettingsController.js').default)
.controller('TicketsController', require('./controllers/TicketsController.js').default)
.controller('TicketDetailController', require('./controllers/TicketDetailController.js').default)
.controller('BookingHistoryController', require('./controllers/BookingHistoryController.js').default)
.directive('myTouchstart', TouchStart)
.directive('myTouchend', TouchEnd)
.directive('myTouchmove', TouchMove)
.directive('myMousemove', MouseMove)
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
.config(configureRoutes)
.config(function($ionicConfigProvider) {
  $ionicConfigProvider.tabs.position('bottom');
  $ionicConfigProvider.navBar.alignTitle('center');
})
.config(function(uiGmapGoogleMapApiProvider) {
  uiGmapGoogleMapApiProvider.configure({
//        client: 'gme-infocommunications',
    key: 'AIzaSyDC38zMc2TIj1-fvtLUdzNsgOQmTBb3N5M',
//        v: ', //defaults to latest 3.X anyhow
    libraries: 'places'
  });
})
.run(function($ionicPlatform, $rootScope, $ionicTabsDelegate, RoutesService) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });

  // hide/show tabs bar depending on how the route is configured
  $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
    if (toState.data && toState.data.hideTabs) {
      $ionicTabsDelegate.showBar(false);
    }
    else {
      $ionicTabsDelegate.showBar(true);
    }
  });

  // Pre-fetch the routes
  RoutesService.getRoutes();
  RoutesService.getRecentRoutes();
});
