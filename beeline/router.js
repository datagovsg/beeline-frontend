import _ from 'lodash';

// Version follows '[date] comment' format
const introSlidesVersion = '2017-02-20'

/**
  * If you want to hide tabs while maintaining proper back button functionality
  * then add data: {hideTabs: true} to the state definition. The hiding of the
  * tabs will be handled globally in main.js ($rootScope.$on('$stateChangeSuccess'))
  *
  * I have absolutely no idea what happens if you use subtabs.
  * The point is, don't use subtabs.
**/

/**
  * The other parameters we define is
    @prop data.back : stateParams -> Array
      A function that returns a state array [state name, state params]
      given a state params. The state array represents the "default back page"
      for a given state, thus preventing the user from getting "stucK".

**/

export default function($stateProvider, $urlRouterProvider, $locationProvider) {

  $stateProvider

  // ////////////////////////////////////////////////////////////////////////////
  // Introductory slides
  // ////////////////////////////////////////////////////////////////////////////
  .state('intro', {
    url: '/intro',
    templateUrl: 'templates/intro-slides.html',
    controller: 'IntroSlidesController'
  })
  .state('welcome', {
    url: '/welcome?refCode',
    templateUrl: 'templates/welcome.html',
    controller: 'WelcomeController'
  })


  // ////////////////////////////////////////////////////////////////////////////
  // Main interface
  // ////////////////////////////////////////////////////////////////////////////
  /** Instead of using abstract: true, we make this page not abstract, because
      we want to provide the $backOrDefault method to the tabs scope.
      When our back button is clicked, this method will be called.
      (We are overriding the default back button. cf tabs.html)
      **/
  .state('tabs', {
    url: '/tabs',
    abstract: true,
    templateUrl: 'templates/tabs.html',
    controller: 'TabsController'
  })

  // ////////////////////////////////////////////////////////////////////////////
  // Main interface, Routes Tab
  // ////////////////////////////////////////////////////////////////////////////
  .state('tabs.routes', {
    url: '/routes',
    views: {
      'tab-routes': {
        templateUrl: 'templates/routes-list.html',
        controller: 'RoutesListController'
      }
    }
  })
  .state('tabs.route-detail', {
    url: '/route/:routeId?pickupStopId&dropoffStopId',
    views: {
      'tab-routes': {
        templateUrl: 'templates/route-detail.html',
        controller: 'RouteDetailController'
      },

      'map-area': {
        templateUrl: 'templates/map-view.html',
        controller: 'MapViewController'
      }
    },
    data: {
      hideTabs: true,
    }
  })
  .state('tabs.route-stops', {
    url: '/route/:routeId/stops?type&stopId',
    views: {
      'tab-routes': {
        templateUrl: 'templates/route-stops.html',
        controller: 'RouteStopsController'
      },

      'map-area': {
        templateUrl: 'templates/map-view.html',
        controller: 'MapViewController'
      }
    },
    params: { callback: null },
    data: {
      hideTabs: true,
    }
  })
  .state('tabs.route-dates', {
    url: '/route/:routeId/dates?boardStop&alightStop&selectedDates',
    views: {
      'tab-routes': {
        templateUrl: 'templates/tab-booking-dates.html',
        controller: 'BookingDatesController',
      }
    },
    data: {
      hideTabs: true,
    }
  })
  .state('tabs.route-summary', {
    url: '/route/:routeId/summary?boardStop&alightStop&selectedDates&promoCode',
    views: {
      'tab-routes': {
        templateUrl: 'templates/tab-booking-summary.html',
        controller: 'BookingSummaryController',
      }
    },
    data: {
      hideTabs: true,
    }
  })
  .state('tabs.route-confirmation', {
    url: '/route/confirmation',
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
  .state('tabs.lite-detail', {
    url: '/lite/detail/:label',
    views: {
      'tab-lite': {
        templateUrl: 'templates/tab-lite-detail.html',
        controller: 'LiteDetailController',
      },

      'map-area': {
        templateUrl: 'templates/map-view.html',
        controller: 'LiteMapViewController'
      }
    },
    data: {
      hideTabs: true,
    }
  })
  .state('tabs.lite-more-info', {
    url: '/lite/more-info/:label/:companyId/',
    views: {
      'tab-lite': {
        templateUrl: 'templates/tab-lite-more-info.html',
        controller: 'LiteMoreInfoController',
      }
    },
    data: {
      hideTabs: true,
      keepMapObject: true
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
      },

      'map-area': {
        templateUrl: 'templates/map-view.html',
        controller: 'TicketMapViewController'
      }
    },
    data: {
      hideTabs: true,
    }
  })

  .state('tabs.lite-route-tracker', {
    url: '/tickets/liteRoute/:label',
    views: {
      'tab-tickets': {
        templateUrl: 'templates/tab-lite-tracker.html',
        controller: 'LiteDetailController',
      },

      'map-area': {
        templateUrl: 'templates/map-view.html',
        controller: 'LiteMapViewController'
      }
    },
    data: {
      hideTabs: true,
    }
  })

  .state('tabs.lite-tracker-more-info', {
    url: '/tickets/liteRoute/:label/:companyId/',
    views: {
      'tab-tickets': {
        templateUrl: 'templates/lite-tracker-more-info.html',
        controller: 'LiteMoreInfoController',
      }
    },
    data: {
      hideTabs: true,
    }
  })


  // ////////////////////////////////////////////////////////////////////////////
  // Main interface, Kickstarter Tab
  // ////////////////////////////////////////////////////////////////////////////
  .state('tabs.crowdstart', {
    url: '/crowdstart',
    views: {
      'tab-crowdstart': {
        templateUrl: 'templates/kickstarter.html',
        controller: 'KickstarterController'
      }
    }
  })

  .state('tabs.crowdstart-recap', {
    url: '/crowdstart/:routeId/recap',
    views: {
      'tab-crowdstart': {
        templateUrl: 'templates/kickstarter-recap.html',
        controller: 'KickstarterRecapController'
      }
    },
    data: {
      hideTabs: true,
    }
  })

  .state('tabs.crowdstart-detail', {
    url: '/crowdstart/:routeId/detail',
    views: {
      'tab-crowdstart': {
        templateUrl: 'templates/kickstarter-detail.html',
        controller: 'KickstarterDetailController'
      },

      'map-area': {
        templateUrl: 'templates/map-view.html',
        controller: 'MapViewController'
      }
    },
    data: {
      hideTabs: true,
    }
  })

  .state('tabs.crowdstart-stops', {
    url: '/crowdstart/:routeId/stops',
    views: {
      'tab-crowdstart': {
        templateUrl: 'templates/kickstarter-stops.html',
        controller: 'KickstarterStopsController'
      },

      'map-area': {
        templateUrl: 'templates/map-view.html',
        controller: 'MapViewController'
      }
    },
    data: {
      hideTabs: true,
      keepMapObject: true
    }
  })

  .state('tabs.crowdstart-summary', {
    url: '/crowdstart/:routeId/summary?bidPrice',
    views: {
      'tab-crowdstart': {
        templateUrl: 'templates/kickstarter-summary.html',
        controller: 'KickstarterSummaryController'
      }
    },
    data: {
      hideTabs: true,
    }
  })

  .state('tabs.crowdstart-commit', {
    url: '/crowdstart/:routeId/commit',
    views: {
      'tab-crowdstart': {
        templateUrl: 'templates/kickstarter-commit.html',
        controller: 'KickstarterCommitController'
      }
    },
    data: {
      hideTabs: true,
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
  })
  .state('tabs.booking-history', {
    url: '/settings/booking-history',
    views: {
      'tab-settings': {
        templateUrl: 'templates/booking-history.html',
        controller: 'BookingHistoryController'
      }
    },
    data: {
      hideTabs: true,
    }
  });

  $locationProvider.html5Mode(true)

  let viewedIntroSlidesVersion = window.localStorage['viewedBeelineSlidesVersion']
  // if none of the above states are matched, use this as the fallback
  if (viewedIntroSlidesVersion
    && viewedIntroSlidesVersion >= introSlidesVersion) {
    $urlRouterProvider.otherwise('/tabs/routes');
  } else {
    // $urlRouterProvider.otherwise('/tabs/routes/map');
    window.localStorage.viewedBeelineSlidesVersion = introSlidesVersion

    $urlRouterProvider.otherwise('/intro');
  }

}
