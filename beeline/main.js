import {setupBroadcastViewEnter} from './shared/util';
import {formatDate, formatDateMMMdd, formatTime,
        formatUTCDate, titleCase} from './shared/format';
// Service Imports
import UserService from './services/UserService.js';
import RoutesService from './services/RoutesService.js';
import TripService from './services/TripService';
import SuggestionService from './services/suggestionService';
import BookingService from './services/bookingService';
import CompanyService from './services/CompanyService';
import TicketService from './services/ticketService';
import OneMapService from './services/oneMapService';
import RevGeocode from './directives/revGeocode/revGeocode';
import CreditCardInput from './services/creditCardInput/creditCardInput';
import DateService from './services/dateService';
import StripeService from './services/stripeService'
// Directive Imports
import PriceCalculator from './directives/priceCalculator/priceCalculator';
import BusStopSelector from './directives/busStopSelector/busStopSelector';
import StartEndPicker from './directives/startEndPicker/startEndPicker';
import routeItem from './directives/routeItem/routeItem.js';
import SuggestionViewer from './directives/suggestionViewer/suggestionViewer';
import {DatePicker, TouchStart, TouchEnd, TouchMove, MouseMove} from './directives/datePicker/datePicker';
import QtyInput from './directives/qtyInput/qtyInput';
// Controller Imports
import RouteMapController from './controllers/routemapcontroller';
import RouteListController from './controllers/routeListController';
import BookingController from './controllers/booking';
import BookingDatesController from './controllers/bookingDates';
import BookingConfirmationController from './controllers/bookingConfirmation';
import BookingSummaryController from './controllers/bookingSummary';
import SuggestController from './controllers/suggestcontroller';
import TicketsController from './controllers/ticketscontroller';
import TicketDetailController from './controllers/ticketdetailcontroller';
import SettingsController from './controllers/settingscontroller';
import LoginController from './controllers/loginController';
// Configuration Imports
import configureRoutes from './router.js';
import AngularGoogleMap from 'angular-google-maps';

////////////////////////////////////////////////////////////////////////////////
// Non-angular configuration
////////////////////////////////////////////////////////////////////////////////
// FIXME: set this in StripeService;
try {
  Stripe.setPublishableKey('pk_test_vYuCaJbm9vZr0NCEMpzJ3KFm');
} catch (err) {}

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
.factory('ticketService', TicketService)
.factory('userService', UserService)
.factory('tripService', TripService)
.factory('companyService', CompanyService)
.factory('suggestionService', SuggestionService)
.factory('Routes', RoutesService)
.factory('bookingService', BookingService)
.factory('oneMapService', OneMapService)
.factory('dateService', DateService)
.factory('creditCardInput', CreditCardInput)
.factory('Stripe', StripeService)
.controller('BookingCtrl', BookingController)
.controller('BookingDatesCtrl', BookingDatesController)
.controller('BookingSummaryCtrl', BookingSummaryController)
.controller('BookingConfirmationCtrl', BookingConfirmationController)
.controller('SuggestCtrl', SuggestController)
.controller('SettingsCtrl', SettingsController)
.controller('TicketsCtrl', TicketsController)
.controller('TicketDetailCtrl', TicketDetailController)
.controller('routeMapCtrl', RouteMapController)
.controller('routeListCtrl', RouteListController)
.controller('LoginCtrl', LoginController)
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
