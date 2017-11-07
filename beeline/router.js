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

export default ['$stateProvider', '$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {
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
    .state('tabs.my-booking-routes', {
      url: '/route/:routeId?pickupStopId&dropoffStopId',
      views: {
        'menuContent': {
          templateUrl: 'templates/route-detail.html',
          controller: 'RouteDetailController'
        },

        'map-area': {
          templateUrl: 'templates/map-view.html',
          controller: 'MapViewController'
        }
      },
      data: {
        showSideMenu: true
      }
    })
    .state('tabs.my-lite-routes', {
      url: '/lite/detail/:label',
      views: {
        'menuContent': {
          templateUrl: 'templates/tab-lite-detail.html',
          controller: 'LiteDetailController',
        },

        'map-area': {
          templateUrl: 'templates/map-view.html',
          controller: 'LiteMapViewController'
        }
      },
      data: {
        showSideMenu: true
      }
    })
    .state('tabs.routes', {
      url: '/routes',
      views: {
        'menuContent': {
          templateUrl: 'templates/routes-list.html',
          controller: 'RoutesListController'
        }
      }
    })
    .state('tabs.route-detail', {
      url: '/route/:routeId?pickupStopId&dropoffStopId',
      views: {
        'menuContent': {
          templateUrl: 'templates/route-detail.html',
          controller: 'RouteDetailController'
        },

        'map-area': {
          templateUrl: 'templates/map-view.html',
          controller: 'MapViewController'
        }
      }
    })
    .state('tabs.route-stops', {
      url: '/route/:routeId/stops?type&stopId',
      views: {
        'menuContent': {
          templateUrl: 'templates/route-stops.html',
          controller: 'RouteStopsController'
        },

        'map-area': {
          templateUrl: 'templates/map-view.html',
          controller: 'MapViewController'
        }
      },
      params: { callback: null }
    })
    .state('tabs.route-dates', {
      url: '/route/:routeId/dates?boardStop&alightStop&selectedDates',
      views: {
        'menuContent': {
          templateUrl: 'templates/tab-booking-dates.html',
          controller: 'BookingDatesController',
        }
      }
    })
    .state('tabs.route-summary', {
      url: '/route/:routeId/summary?boardStop&alightStop&selectedDates&promoCode',
      views: {
        'menuContent': {
          templateUrl: 'templates/tab-booking-summary.html',
          controller: 'BookingSummaryController',
        }
      }
    })
    .state('tabs.route-confirmation', {
      url: '/route/confirmation',
      views: {
        'menuContent': {
          templateUrl: 'templates/tab-booking-confirmation.html',
          controller: 'BookingConfirmationController',
        },
      }
    })
    .state('tabs.lite-detail', {
      url: '/lite/detail/:label',
      views: {
        'menuContent': {
          templateUrl: 'templates/tab-lite-detail.html',
          controller: 'LiteDetailController',
        },

        'map-area': {
          templateUrl: 'templates/map-view.html',
          controller: 'LiteMapViewController'
        }
      }
    })
    .state('tabs.lite-more-info', {
      url: '/lite/more-info/:label/:companyId/',
      views: {
        'menuContent': {
          templateUrl: 'templates/tab-lite-more-info.html',
          controller: 'LiteMoreInfoController',
        }
      }
    })

    // ////////////////////////////////////////////////////////////////////////////
    // Main interface, Sugesstions Tab
    // ////////////////////////////////////////////////////////////////////////////
    .state('tabs.suggest', {
      url: '/suggest/:action',
      views: {
        'menuContent': {
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
        'menuContent': {
          templateUrl: 'templates/tickets.html',
          controller: 'TicketsController'
        }
      }
    })

    .state('tabs.ticket-detail', {
      url: '/tickets/:ticketId',
      views: {
        'menuContent': {
          templateUrl: 'templates/ticket-detail.html',
          controller: 'TicketDetailController'
        },

        'map-area': {
          templateUrl: 'templates/map-view.html',
          controller: 'TicketMapViewController'
        }
      }
    })

    .state('tabs.lite-route-tracker', {
      url: '/tickets/liteRoute/:label',
      views: {
        'menuContent': {
          templateUrl: 'templates/tab-lite-tracker.html',
          controller: 'LiteDetailController',
        },

        'map-area': {
          templateUrl: 'templates/map-view.html',
          controller: 'LiteMapViewController'
        }
      }
    })

    .state('tabs.lite-tracker-more-info', {
      url: '/tickets/liteRoute/:label/:companyId/',
      views: {
        'menuContent': {
          templateUrl: 'templates/lite-tracker-more-info.html',
          controller: 'LiteMoreInfoController',
        }
      }
    })


    // ////////////////////////////////////////////////////////////////////////////
    // Main interface, Kickstarter Tab
    // ////////////////////////////////////////////////////////////////////////////
    .state('tabs.crowdstart', {
      url: '/crowdstart',
      views: {
        'menuContent': {
          templateUrl: 'templates/kickstarter.html',
          controller: 'KickstarterController'
        }
      }
    })

    .state('tabs.crowdstart-recap', {
      url: '/crowdstart/:routeId/recap',
      views: {
        'menuContent': {
          templateUrl: 'templates/kickstarter-recap.html',
          controller: 'KickstarterRecapController'
        }
      }
    })

    .state('tabs.crowdstart-detail', {
      url: '/crowdstart/:routeId/detail',
      views: {
        'menuContent': {
          templateUrl: 'templates/kickstarter-detail.html',
          controller: 'KickstarterDetailController'
        },

        'map-area': {
          templateUrl: 'templates/map-view.html',
          controller: 'MapViewController'
        }
      }
    })

    .state('tabs.crowdstart-stops', {
      url: '/crowdstart/:routeId/stops',
      views: {
        'menuContent': {
          templateUrl: 'templates/kickstarter-stops.html',
          controller: 'KickstarterStopsController'
        },

        'map-area': {
          templateUrl: 'templates/map-view.html',
          controller: 'MapViewController'
        }
      }
    })

    .state('tabs.crowdstart-summary', {
      url: '/crowdstart/:routeId/summary?bidPrice',
      views: {
        'menuContent': {
          templateUrl: 'templates/kickstarter-summary.html',
          controller: 'KickstarterSummaryController'
        }
      }
    })

    .state('tabs.crowdstart-commit', {
      url: '/crowdstart/:routeId/commit',
      views: {
        'menuContent': {
          templateUrl: 'templates/kickstarter-commit.html',
          controller: 'KickstarterCommitController'
        }
      }
    })

    // ////////////////////////////////////////////////////////////////////////////
    // Main interface, Settings Tab
    // ////////////////////////////////////////////////////////////////////////////
    .state('tabs.settings', {
      url: '/settings',
      views: {
        'menuContent': {
          templateUrl: 'templates/settings.html',
          controller: 'SettingsController'
        }
      }
    })
    .state('tabs.booking-history', {
      url: '/settings/booking-history',
      views: {
        'menuContent': {
          templateUrl: 'templates/booking-history.html',
          controller: 'BookingHistoryController'
        }
      }
    });

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
}]
