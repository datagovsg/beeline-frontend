import {setupBroadcastViewEnter} from './shared/util'

export default function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
  .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  // Each tab has its own nav history stack:

  .state('tab.routes', {
    url: '/routes',
    views: {
      'tab-routes': {
    abstract: true,
        templateUrl: 'templates/routes.html',
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
        templateUrl: 'templates/routemap.html',
        controller: 'routeMapCtrl'
      }
    }
  })

  .state('tab.routes.routelist', {
    url: '/routelist',
    views: {
      'routes-routelist': {
        templateUrl: 'templates/routelist.html',
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
};