export default function($stateProvider, $urlRouterProvider) {

  $stateProvider

  //////////////////////////////////////////////////////////////////////////////
  // Introductory slides
  //////////////////////////////////////////////////////////////////////////////
  .state('intro', {
    url: '/intro',
    templateUrl: 'templates/intro-slides.html',
    controller: 'IntroSlidesController'
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
        templateUrl: 'templates/routes.html',
        controller: 'RoutesController'
      }
    }
  })

// Putting this here temporarily to test before routing it in properly
  .state('tabs.results', {
    url: '/routes/results?pickupLat&pickupLng&dropoffLat&dropoffLng',
    views: {
      'tab-routes': {
        templateUrl: 'templates/routes-results.html',
        controller: 'RoutesResultsController'
      }
    }
  })

  .state('tabs.bookingPickup', {
    url: '/booking/pickup/:routeId?boardStop&alightStop',
    views: {
      'tab-booking': {
        templateUrl: 'templates/tab-booking-stops.html',
        controller: 'BookingStopsController',
      }
    }
  })

  .state('tabs.booking-dates', {
    url: '/booking/dates/:routeId?boardStop&alightStop',
    views: {
        'tab-booking': {
            templateUrl: 'templates/tab-booking-dates.html',
            controller: 'BookingDatesController',
        },
    },
  })
  .state('tabs.booking-summary', {
    url: '/booking/summary/:routeId?boardStop&alightStop&selectedDates',
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
        templateUrl: 'templates/tickets.html',
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
        templateUrl: 'templates/settings.html',
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
    url: '/login-verify?telephone',
    templateUrl: 'templates/verify.html',
    controller: 'VerifyController'
  });

  // if none of the above states are matched, use this as the fallback
  if (window.localStorage['sessionToken'] && window.localStorage['sessionToken']!=null) {
    $urlRouterProvider.otherwise('/tabs/routes');
  } else {
    // $urlRouterProvider.otherwise('/tabs/routes/map');
    $urlRouterProvider.otherwise('/intro');
  }

};
