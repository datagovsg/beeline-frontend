
/**
  * If you want to hide tabs while maintaining proper back button functionality
  * then add data: {hideTabs: true} to the state definition. The hiding of the
  * tabs will be handled globally in main.js ($rootScope.$on('$stateChangeSuccess'))
  *
  * I have absolutely no idea what happens if you use subtabs.
  * The point is, don't use subtabs.
**/

export default function($stateProvider, $urlRouterProvider) {
  $stateProvider

  // ////////////////////////////////////////////////////////////////////////////
  // Introductory slides
  // ////////////////////////////////////////////////////////////////////////////
  .state('intro', {
    url: '/intro',
    templateUrl: 'templates/intro-slides.html',
    controller: 'IntroSlidesController'
  })

  // ////////////////////////////////////////////////////////////////////////////
  // Main interface
  // ////////////////////////////////////////////////////////////////////////////
  .state('tabs', {
    url: '/tabs',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  // ////////////////////////////////////////////////////////////////////////////
  // Main interface, Routes Tab
  // ////////////////////////////////////////////////////////////////////////////
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
        controller: 'RoutesResultsController',
        data: {
          hideTabs: true,
        }
      }
    }
  })

  .state('tabs.bookingPickup', {
    url: '/routes/:routeId/booking/stops?boardStop&alightStop',
    views: {
      'tab-routes': {
        templateUrl: 'templates/tab-booking-stops.html',
        controller: 'BookingStopsController',
      }
    },
    data: {
      hideTabs: true,
    }
  })

  .state('tabs.booking-dates', {
    url: '/routes/:routeId/booking/dates?boardStop&alightStop',
    views: {
      'tab-routes': {
        templateUrl: 'templates/tab-booking-dates.html',
        controller: 'BookingDatesController',
      },
    },
    data: {
      hideTabs: true,
    }
  })
  .state('tabs.booking-summary', {
    url: '/routes/:routeId/booking/summary?boardStop&alightStop&selectedDates',
    views: {
      'tab-routes': {
        templateUrl: 'templates/tab-booking-summary.html',
        controller: 'BookingSummaryController',
      },
    },
    data: {
      hideTabs: true,
    }
  })
  .state('tabs.booking-confirmation', {
    url: '/routes/booking/confirmation',
    views: {
      'tab-routes': {
        templateUrl: 'templates/tab-booking-confirmation.html',
        controller: 'BookingConfirmationController',
      },
    },
    data: {
      hideTabs: true,
    }
  })

  // ////////////////////////////////////////////////////////////////////////////
  // Main interface, Sugesstions Tab
  // ////////////////////////////////////////////////////////////////////////////
  .state('tabs.suggest', {
    url: '/suggest/:action',
    views: {
      'tab-suggest': {
        templateUrl: 'templates/tab-suggest.html',
        controller: 'SuggestController'
      }
    }
  })

  // ////////////////////////////////////////////////////////////////////////////
  // Main interface, Tickets Tab
  // ////////////////////////////////////////////////////////////////////////////
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
    url: '/tickets/:ticketId',
    views: {
      'tab-tickets': {
        templateUrl: 'templates/ticket-detail.html',
        controller: 'TicketDetailController'
      }
    }
  })

  // ////////////////////////////////////////////////////////////////////////////
  // Main interface, Settings Tab
  // ////////////////////////////////////////////////////////////////////////////
  .state('tabs.settings', {
    url: '/settings',
    views: {
      'tab-settings': {
        templateUrl: 'templates/settings.html',
        controller: 'SettingsController'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  if (window.localStorage['sessionToken'] && window.localStorage['sessionToken'] != null) {
    $urlRouterProvider.otherwise('/tabs/routes');
  } else {
    // $urlRouterProvider.otherwise('/tabs/routes/map');
    $urlRouterProvider.otherwise('/intro');
  }

}
