/* eslint-disable angular/window-service */

// Version follows '[date] comment' format
const introSlidesVersion = '2017-02-20'

/**
  * The other parameters we define is
    @prop data.back : stateParams -> Array
      A function that returns a state array [state name, state params]
      given a state params. The state array represents the "default back page"
      for a given state, thus preventing the user from getting "stucK".

**/

export default [
  '$stateProvider',
  '$urlRouterProvider',
  function ($stateProvider, $urlRouterProvider) {
    $stateProvider

      // ////////////////////////////////////////////////////////////////////////////
      // Introductory slides
      // ////////////////////////////////////////////////////////////////////////////
      .state('intro', {
        url: '/intro',
        templateUrl: 'templates/intro-slides.html',
        controller: 'IntroSlidesController',
      })

      .state('tabs', {
        url: '/tabs',
        templateUrl: 'templates/tabs.html',
        controller: 'TabsController',
      })

      // ////////////////////////////////////////////////////////////////////////////
      // Main interface, Routes Tab
      // ////////////////////////////////////////////////////////////////////////////
      .state('tabs.routes', {
        url: '/routes',
        views: {
          menuContent: {
            templateUrl: 'templates/routes-list.html',
            controller: 'RoutesListController',
          },
        },
      })
      .state('tabs.yourRoutes', {
        url: '/routes/yourRoutes',
        views: {
          menuContent: {
            templateUrl: 'templates/routes-list.html',
            controller: 'RoutesListController',
          },
        },
      })
      .state('tabs.route-detail', {
        url: '/route/:routeId?pickupStopId&dropoffStopId',
        views: {
          menuContent: {
            templateUrl: 'templates/route-detail.html',
            controller: 'RouteDetailController',
          },

          'map-area': {
            templateUrl: 'templates/map-view.html',
            controller: 'RouteDetailMapViewController',
          },
        },
      })
      .state('tabs.route-stops', {
        url: '/route/:routeId/stops?type&stopId',
        views: {
          menuContent: {
            templateUrl: 'templates/route-stops.html',
            controller: 'RouteStopsController',
          },

          'map-area': {
            templateUrl: 'templates/map-view.html',
            controller: 'MapViewController',
          },
        },
        params: { callback: null },
      })
      .state('tabs.route-dates', {
        url: '/route/:routeId/dates?boardStop&alightStop&selectedDates',
        views: {
          menuContent: {
            templateUrl: 'templates/tab-booking-dates.html',
            controller: 'BookingDatesController',
          },
        },
      })
      .state('tabs.route-summary', {
        url:
          '/route/:routeId/summary?boardStop&alightStop&selectedDates&promoCode',
        views: {
          menuContent: {
            templateUrl: 'templates/tab-booking-summary.html',
            controller: 'BookingSummaryController',
          },
        },
      })
      .state('tabs.route-confirmation', {
        url: '/route/confirmation',
        views: {
          menuContent: {
            templateUrl: 'templates/tab-booking-confirmation.html',
            controller: 'BookingConfirmationController',
          },
        },
      })
      .state('tabs.lite-detail', {
        url: '/lite/detail/:label',
        views: {
          menuContent: {
            templateUrl: 'templates/tab-lite-detail.html',
            controller: 'LiteDetailController',
          },

          'map-area': {
            templateUrl: 'templates/map-view.html',
            controller: 'LiteMapViewController',
          },
        },
      })
      .state('tabs.lite-more-info', {
        url: '/lite/more-info/:label/:companyId/',
        views: {
          menuContent: {
            templateUrl: 'templates/tab-lite-more-info.html',
            controller: 'LiteMoreInfoController',
          },
        },
      })

      .state('tabs.purchase-route-pass', {
        url: '/routePass/:routeId/',
        views: {
          menuContent: {
            templateUrl: 'templates/tab-purchase-route-pass.html',
            controller: 'PurchaseRoutePassController',
          },
        },
      })

      // ////////////////////////////////////////////////////////////////////////////
      // Main interface, Tickets Tab
      // ////////////////////////////////////////////////////////////////////////////
      .state('tabs.tickets', {
        url: '/tickets',
        views: {
          menuContent: {
            templateUrl: 'templates/tickets.html',
            controller: 'TicketsController',
          },
        },
      })

      // ////////////////////////////////////////////////////////////////////////////
      // Main interface, Suggestions Tab
      // ////////////////////////////////////////////////////////////////////////////
      .state('tabs.your-suggestions', {
        url: '/your-suggestions',
        views: {
          menuContent: {
            templateUrl: 'templates/your-suggestions.html',
            controller: 'YourSuggestionsController',
          },
        },
      })

      .state('tabs.your-suggestions-detail', {
        url: '/your-suggestions/1',
        views: {
          menuContent: {
            templateUrl: 'templates/your-suggestions-detail.html',
            // controller: 'PurchaseRoutePassController',
          },
        },
      })

      // ////////////////////////////////////////////////////////////////////////////
      // Main interface, Crowdstart Tab
      // ////////////////////////////////////////////////////////////////////////////

      .state('tabs.crowdstart-detail', {
        url: '/crowdstart/:routeId/detail',
        views: {
          menuContent: {
            templateUrl: 'templates/crowdstart-detail.html',
            controller: 'CrowdstartDetailController',
          },
          'map-area': {
            templateUrl: 'templates/map-view.html',
            controller: 'MapViewController',
          },
        },
      })

      .state('tabs.crowdstart-stops', {
        url: '/crowdstart/:routeId/stops',
        views: {
          menuContent: {
            templateUrl: 'templates/crowdstart-stops.html',
            controller: 'CrowdstartStopsController',
          },
          'map-area': {
            templateUrl: 'templates/map-view.html',
            controller: 'MapViewController',
          },
        },
      })

      .state('tabs.crowdstart-summary', {
        url: '/crowdstart/:routeId/summary?bidPrice&bidded',
        views: {
          menuContent: {
            templateUrl: 'templates/crowdstart-summary.html',
            controller: 'CrowdstartSummaryController',
          },
        },
      })

      // ////////////////////////////////////////////////////////////////////////////
      // Main interface, Settings Tab
      // ////////////////////////////////////////////////////////////////////////////
      .state('tabs.settings', {
        url: '/settings',
        views: {
          menuContent: {
            templateUrl: 'templates/settings.html',
            controller: 'SettingsController',
          },
        },
      })
      .state('tabs.booking-history', {
        url: '/settings/booking-history',
        views: {
          menuContent: {
            templateUrl: 'templates/booking-history.html',
            controller: 'BookingHistoryController',
          },
        },
      })

    let viewedIntroSlidesVersion =
      window.localStorage.viewedBeelineSlidesVersion
    // if none of the above states are matched, use this as the fallback
    if (
      viewedIntroSlidesVersion &&
      viewedIntroSlidesVersion >= introSlidesVersion
    ) {
      // user is logged in
      if (window.localStorage.sessionToken && window.localStorage.beelineUser) {
        $urlRouterProvider.otherwise('/tabs/routes/yourRoutes')
      } else {
        $urlRouterProvider.otherwise('/tabs/routes')
      }
    } else {
      window.localStorage.viewedBeelineSlidesVersion = introSlidesVersion
      $urlRouterProvider.otherwise('/intro')
    }
  },
]
