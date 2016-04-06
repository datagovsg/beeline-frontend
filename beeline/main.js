import {formatDate, formatDateMMMdd, formatTime,
        formatUTCDate, titleCase} from './shared/format';
// Service Imports
import UserService from './services/UserService.js';
import RoutesService from './services/RoutesService.js';
import TripService from './services/TripService.js';
import SuggestionService from './services/SuggestionService.js';
import BookingService from './services/BookingService.js';
import CompanyService from './services/CompanyService.js';
import TicketService from './services/TicketService.js';
import OneMapService from './services/OneMapService.js';
import DateService from './services/DateService.js';
import StripeService from './services/StripeService.js'
import CreditCardInputService from './services/CreditCardInputService.js';
// Controller Imports
import RoutesMapController from './controllers/RoutesMapController.js';
import RoutesListController from './controllers/RoutesListController.js';
import BookingController from './controllers/BookingController.js';
import BookingDatesController from './controllers/BookingDatesController.js';
import BookingConfirmationController from './controllers/BookingConfirmationController.js';
import BookingSummaryController from './controllers/BookingSummaryController.js';
import SuggestController from './controllers/SuggestController.js';
import TicketsController from './controllers/TicketsController.js';
import TicketDetailController from './controllers/TicketDetailController.js';
import SettingsController from './controllers/SettingsController.js';
// Directive Imports
import RevGeocode from './directives/revGeocode/revGeocode';
import PriceCalculator from './directives/priceCalculator/priceCalculator';
import BusStopSelector from './directives/busStopSelector/busStopSelector';
import StartEndPicker from './directives/startEndPicker/startEndPicker';
import routeItem from './directives/routeItem/routeItem.js';
import SuggestionViewer from './directives/suggestionViewer/suggestionViewer';
import {DatePicker, TouchStart, TouchEnd, TouchMove, MouseMove} from './directives/datePicker/datePicker';
import QtyInput from './directives/qtyInput/qtyInput';
// Configuration Imports
import configureRoutes from './router.js';
import AngularGoogleMap from 'angular-google-maps';

////////////////////////////////////////////////////////////////////////////////
// Non-angular configuration
////////////////////////////////////////////////////////////////////////////////
// FIXME: set this in StripeService;
try {
  Stripe.setPublishableKey('pk_test_vYuCaJbm9vZr0NCEMpzJ3KFm');
} 
catch (error) {}

////////////////////////////////////////////////////////////////////////////////
// Angular configuration
////////////////////////////////////////////////////////////////////////////////
var app = angular.module('beeline', [
    'ionic',
    'ngCordova',
    'uiGmapgoogle-maps'
])
.constant('SERVER_URL', 'http://staging.beeline.sg')
.filter('formatDate', () => formatDate)
.filter('formatDateMMMdd', () => formatDateMMMdd)
.filter('formatUTCDate', () => formatUTCDate)
.filter('formatTime', () => formatTime)
.filter('formatHHMM_ampm', () => formatHHMM_ampm)
.filter('titleCase', () => titleCase)
.filter('monthNames', function () {
    return function (i) {
        monthNames = 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(',');
        return monthNames[i];
    };
})
.factory('TicketService', TicketService)
.factory('UserService', UserService)
.factory('TripService', TripService)
.factory('CompanyService', CompanyService)
.factory('SuggestionService', SuggestionService)
.factory('RoutesService', RoutesService)
.factory('BookingService', BookingService)
.factory('OneMapService', OneMapService)
.factory('DateService', DateService)
.factory('CreditCardInputService', CreditCardInputService)
.factory('StripeService', StripeService)
.controller('BookingController', BookingController)
.controller('BookingDatesController', BookingDatesController)
.controller('BookingSummaryController', BookingSummaryController)
.controller('BookingConfirmationController', BookingConfirmationController)
.controller('SuggestController', SuggestController)
.controller('SettingsController', SettingsController)
.controller('TicketsController', TicketsController)
.controller('TicketDetailController', TicketDetailController)
.controller('RoutesMapController', RoutesMapController)
.controller('RoutesListController', RoutesListController)
.directive('datePicker', DatePicker)
.directive('myTouchstart', TouchStart)
.directive('myTouchend', TouchEnd)
.directive('myTouchmove', TouchMove)
.directive('myMousemove', MouseMove)
.directive('qtyInput', QtyInput)
.directive('suggestionViewer', SuggestionViewer)
.directive('startEndPicker', StartEndPicker)
.directive('busStopSelector', BusStopSelector)
.directive('priceCalculator', PriceCalculator)
.directive('revGeocode', RevGeocode)
.directive('routeItem', routeItem)
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
.run(function($ionicPlatform) {
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
});