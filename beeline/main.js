import {DatePicker, TouchStart, TouchEnd, TouchMove, MouseMove} from './directives/datePicker/datePicker'
import DateService from './services/dateService'
import {BookingController} from './controllers/booking'
import {BookingDatesController} from './controllers/bookingDates'
import {BookingConfirmationController} from './controllers/bookingConfirmation'
import {BookingSummaryController} from './controllers/bookingSummary'
import {SettingsController} from './controllers/settingscontroller'
import {SuggestController} from './controllers/suggestcontroller'
import {TicketsController} from './controllers/ticketscontroller'
import {TicketDetailController} from './controllers/ticketdetailcontroller'
import {RouteMapController} from './controllers/routemapcontroller'
import {RouteListController} from './controllers/routelistcontroller'
import QtyInput from './directives/qtyInput/qtyInput'
import PriceCalculator from './directives/priceCalculator/priceCalculator'
import BusStopSelector from './directives/busStopSelector/busStopSelector'
import {SearchService, RoutesService} from './services/routesService'
import {TicketService, UserService, TripService, CompanyService} from './services/ticketService'
import SuggestionService from './services/suggestionService'
import CreditCardInput from './services/creditCardInput/creditCardInput'
import RevGeocode from './directives/revGeocode/revGeocode'
import BookingService from './services/bookingService'
import OneMapService from './services/oneMapService'
import SuggestionViewer from './directives/suggestionViewer/suggestionViewer'
import StartEndPicker from './directives/startEndPicker/startEndPicker'
import AngularGoogleMap from 'angular-google-maps'
import {formatDate, formatDateMMMdd, formatTime,
    formatUTCDate, titleCase} from './shared/format'
import {setupBroadcastViewEnter} from './shared/util'

Stripe.setPublishableKey('pk_test_vYuCaJbm9vZr0NCEMpzJ3KFm');

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

.config(function($ionicConfigProvider) {
  $ionicConfigProvider.tabs.position('bottom');
  $ionicConfigProvider.navBar.alignTitle('center');
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/0_tabs.html'
  })

  // Each tab has its own nav history stack:

  .state('tab.routes', {
    url: '/routes',
    views: {
      'tab-routes': {
		abstract: true,
        templateUrl: 'templates/1_0_routes.html',
        controller: function ($scope) {
            setupBroadcastViewEnter($scope);
        }
      }
    }
  })

  .state('tab.routes.routemap', {
    url: '/routemap',
    views: {
      'routes-routemap': {
        templateUrl: 'templates/1_a_routemap.html',
        controller: 'routeMapCtrl'
      }
    }
  })

  .state('tab.routes.routelist', {
    url: '/routelist',
    views: {
      'routes-routelist': {
        templateUrl: 'templates/1_b_routelist.html',
        controller: 'routeListCtrl'
      }
    }
  })

  .state('tab.suggest', {
    url: '/suggest/:action',
    views: {
      'tab-suggest': {
        templateUrl: 'templates/tab-suggest.html',
        controller: 'SuggestCtrl'
      }
    }
  })

  .state('tab.booking-last', {
    url: '/booking',
    views: {
      'tab-booking': {
        // templateUrl: 'templates/tab-booking-dates.html',
        template: '<ion-content>Whoa?</ion-content>',
        controller: ['$state', 'bookingService', function ($state, bookingService) {
            if (!bookingService.last) {
                $state.go('tab.booking-pickup');
            }
            else {
                $state.go(bookingService.last);
            }
        }],
      }
    }
  })
  .state('tab.booking-pickup', {
    url: '/booking/pickup',
    views: {
      'tab-booking': {
        templateUrl: 'templates/tab-booking.html',
        controller: 'BookingCtrl',
      }
    }
  })
  .state('tab.booking-dropoff', {
    url: '/booking/dropoff',
    views: {
      'tab-booking': {
        templateUrl: 'templates/tab-booking.html',
        controller: 'BookingCtrl',
      }
    }
  })
  .state('tab.booking-dates', {
    url: '/booking/dates',
    views: {
        'tab-booking': {
            templateUrl: 'templates/tab-booking-dates.html',
            controller: 'BookingDatesCtrl',
        },
    },
  })
  .state('tab.booking-summary', {
    url: '/booking/summary',
    views: {
        'tab-booking': {
            templateUrl: 'templates/tab-booking-summary.html',
            controller: 'BookingSummaryCtrl',
        },
    },
  })
  .state('tab.booking-confirmation', {
    url: '/booking/confirmation',
    views: {
        'tab-booking': {
            templateUrl: 'templates/tab-booking-confirmation.html',
            controller: 'BookingConfirmationCtrl',
        },
    },
  })

  .state('tab.tickets', {
    url: '/tickets',
    views: {
      'tab-tickets': {
        templateUrl: 'templates/tab-tickets.html',
        controller: 'TicketsCtrl'
      }
    }
  })

  .state('tab.ticket-detail', {
    url: '/tickets/:tid',
    views: {
      'tab-tickets': {
        templateUrl: 'templates/ticket-detail.html',
        controller: 'TicketDetailCtrl'
      }
    }
  })

  .state('tab.settings', {
    url: '/settings',
    views: {
      'tab-settings': {
        templateUrl: 'templates/5_0_settings.html',
        controller: 'SettingsCtrl'
      }
    }
  })

  .state('tab.settings-login', {
      url: '/settings/login',
      views: {
        'tab-settings': {
          templateUrl: 'templates/5_1_1_login.html',
          controller: 'SettingsCtrl'
        }
      }
    })

    .state('tab.settings-login-verify', {
        url: '/settings/login/verify',
        views: {
          'tab-settings': {
            templateUrl: 'templates/5_1_2_verify.html',
            controller: 'SettingsCtrl'
          }
        }
      });

  // if none of the above states are matched, use this as the fallback
 if (window.localStorage['sessionToken'] && window.localStorage['sessionToken']!=null) {

      $urlRouterProvider.otherwise('/tab/routes/routelist');
  }
  else {
      $urlRouterProvider.otherwise('/tab/routes/routemap');
  }
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
