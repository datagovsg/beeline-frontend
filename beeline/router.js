import {setupBroadcastViewEnter} from './shared/util'

// Ionic uses AngularUI Router which uses the concept of states
// Learn more here: https://github.com/angular-ui/ui-router
// Set up the various states which the app can be in
export default function($stateProvider, $urlRouterProvider) {

  $stateProvider

  //////////////////////////////////////////////////////////////////////////////
  // Introductory slides
  //////////////////////////////////////////////////////////////////////////////
  .state('intro', {
    url: '/intro',
    templateUrl: 'templates/intro.html'
  })

  //////////////////////////////////////////////////////////////////////////////
  // Main interface
  //////////////////////////////////////////////////////////////////////////////
  .state('tabs', {
    url: '/tabs',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  //////////////////////////////////////////////////////////////////////////////
  // Main interface, Routes Tab
  //////////////////////////////////////////////////////////////////////////////
  .state('tabs.routes', {
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

  .state('tabs.routes.map', {
    url: '/map',
    views: {
      'routes-map': {
        templateUrl: 'templates/routes-map.html',
        controller: 'RoutesMapController'
      }
    }
  })

  .state('tabs.routes.list', {
    url: '/list',
    views: {
      'routes-list': {
        templateUrl: 'templates/routes-list.html',
        controller: 'RoutesListController'
      }
    }
  })

  .state('tabs.booking-last', {
    url: '/booking',
    views: {
      'tab-booking': {
        // templateUrl: 'templates/tab-booking-dates.html',
        template: '<ion-content>Whoa?</ion-content>',
        controller: ['$state', 'BookingService', function ($state, bookingService) {
            if (!bookingService.last) {
                $state.go('tabs.booking-pickup');
            }
            else {
                $state.go(bookingService.last);
            }
        }],
      }
    }
  })
  .state('tabs.booking-pickup', {
    url: '/booking/pickup',
    views: {
      'tab-booking': {
        templateUrl: 'templates/tab-booking.html',
        controller: 'BookingController',
      }
    }
  })
  .state('tabs.booking-dropoff', {
    url: '/booking/dropoff',
    views: {
      'tab-booking': {
        templateUrl: 'templates/tab-booking.html',
        controller: 'BookingController',
      }
    }
  })
  .state('tabs.booking-dates', {
    url: '/booking/dates',
    views: {
        'tab-booking': {
            templateUrl: 'templates/tab-booking-dates.html',
            controller: 'BookingDatesController',
        },
    },
  })
  .state('tabs.booking-summary', {
    url: '/booking/summary',
    views: {
        'tab-booking': {
            templateUrl: 'templates/tab-booking-summary.html',
            controller: 'BookingSummaryController',
        },
    },
  })
  .state('tabs.booking-confirmation', {
    url: '/booking/confirmation',
    views: {
        'tab-booking': {
            templateUrl: 'templates/tab-booking-confirmation.html',
            controller: 'BookingConfirmationController',
        },
    },
  })

  //////////////////////////////////////////////////////////////////////////////
  // Main interface, Sugesstions Tab
  //////////////////////////////////////////////////////////////////////////////
  .state('tabs.suggest', {
    url: '/suggest/:action',
    views: {
      'tab-suggest': {
        templateUrl: 'templates/tab-suggest.html',
        controller: 'SuggestController'
      }
    }
  })

  //////////////////////////////////////////////////////////////////////////////
  // Main interface, Tickets Tab
  //////////////////////////////////////////////////////////////////////////////
  .state('tabs.tickets', {
    url: '/tickets',
    views: {
      'tab-tickets': {
        templateUrl: 'templates/tab-tickets.html',
        controller: 'TicketsController'
      }
    }
  })

  .state('tabs.ticket-detail', {
    url: '/tickets/:tid',
    views: {
      'tab-tickets': {
        templateUrl: 'templates/ticket-detail.html',
        controller: 'TicketDetailController'
      }
    }
  })

  //////////////////////////////////////////////////////////////////////////////
  // Main interface, Settings Tab
  //////////////////////////////////////////////////////////////////////////////
  .state('tabs.settings', {
    url: '/settings',
    views: {
      'tab-settings': {
        templateUrl: 'templates/5_0_settings.html',
        controller: 'SettingsController'
      }
    }
  })

  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'LoginController'
  })

  .state('login-verify', {
    url: '/login-verify',
    templateUrl: 'templates/verify.html',
    controller: 'LoginController'
  });

  // if none of the above states are matched, use this as the fallback
  if (window.localStorage['sessionToken'] && window.localStorage['sessionToken']!=null) {
    $urlRouterProvider.otherwise('/tabs/routes/list');
  } else {
    $urlRouterProvider.otherwise('/tabs/routes/map');
  }

};
