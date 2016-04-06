import {DatePicker, TouchStart, TouchEnd, TouchMove, MouseMove} from './directives/datePicker/datePicker';
import DateService from './services/dateService';
import {BookingController} from './controllers/booking';
import {BookingDatesController} from './controllers/bookingDates';
import {BookingConfirmationController} from './controllers/bookingConfirmation';
import {BookingSummaryController} from './controllers/bookingSummary';
import {SettingsController} from './controllers/settingscontroller';
import {SuggestController} from './controllers/suggestcontroller';
import {TicketsController} from './controllers/ticketscontroller';
import {TicketDetailController} from './controllers/ticketdetailcontroller';
import {RouteMapController} from './controllers/routemapcontroller';
import RouteListController from './controllers/routeListController';
import QtyInput from './directives/qtyInput/qtyInput';
import PriceCalculator from './directives/priceCalculator/priceCalculator';
import BusStopSelector from './directives/busStopSelector/busStopSelector';
import {SearchService, RoutesService} from './services/routesService';
import {TicketService, UserService, TripService, CompanyService} from './services/ticketService';
import StripeService from './services/stripeService'
import SuggestionService from './services/suggestionService';
import CreditCardInput from './services/creditCardInput/creditCardInput';
import RevGeocode from './directives/revGeocode/revGeocode';
import BookingService from './services/bookingService';
import OneMapService from './services/oneMapService';
import SuggestionViewer from './directives/suggestionViewer/suggestionViewer';
import StartEndPicker from './directives/startEndPicker/startEndPicker';
import AngularGoogleMap from 'angular-google-maps';
import {formatDate, formatDateMMMdd, formatTime,
    formatUTCDate, titleCase} from './shared/format';
import {setupBroadcastViewEnter} from './shared/util';
import configureRoutes from './router.js';

////////////////////////////////////////////////////////////////////////////////
// Non-angular configuration
////////////////////////////////////////////////////////////////////////////////
// FIXME: set this in StripeService;
Stripe.setPublishableKey('pk_test_vYuCaJbm9vZr0NCEMpzJ3KFm');

////////////////////////////////////////////////////////////////////////////////
// Angular configuration
////////////////////////////////////////////////////////////////////////////////
var app = angular.module('beeline', [
    'ionic',
    'ngCordova',
    'uiGmapgoogle-maps'
])
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
.factory('Search', SearchService)
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
