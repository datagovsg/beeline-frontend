import _ from "lodash"
import { sleep } from "../shared/util"
import querystring from "querystring"
import moment from "moment-timezone"

export default [
  "$scope",
  "$q",
  "$state",
  "$rootScope",
  "RoutesService",
  "KickstarterService",
  "LiteRoutesService",
  "LiteRouteSubscriptionService",
  "SearchService",
  "BookingService",
  "SearchEventService",
  "RequestService",
  "$window",
  "OneMapPlaceService",
  "$ionicHistory",
  "$location",
  "$anchorScroll",
  "$timeout",
  function(
    // Angular Tools
    $scope,
    $q,
    $state,
    $rootScope,
    // Route Information
    RoutesService,
    KickstarterService,
    LiteRoutesService,
    // Misc
    LiteRouteSubscriptionService,
    SearchService,
    BookingService,
    SearchEventService,
    RequestService,
    $window,
    OneMapPlaceService,
    $ionicHistory,
    $location,
    $anchorScroll,
    $timeout
  ) {
    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    // Explicitly declare/initialize of scope variables we use
    $scope.data = {
      placeQuery: null, // The place object used to search
      queryText: "", // The actual text in the box
      // Different types of route data
      routesWithRidesRemaining: null,
      backedCrowdstartRoutes: null,
      recentRoutes: null,
      recentRoutesById: null,
      liteRoutes: null,
      subscribedLiteRoutes: null,
      routes: null,
      crowdstartRoutes: null,
      isFiltering: null,
      routesYouMayLike: null,
      routesAvailable: false,
    }

    $scope.disp = {
      yourRoutes:
        $ionicHistory.currentStateName() === "tabs.yourRoutes" ? true : false,
      title:
        $ionicHistory.currentStateName() === "tabs.yourRoutes"
          ? "Your Routes"
          : "All Routes",
    }
    // ------------------------------------------------------------------------
    // Ionic events
    // ------------------------------------------------------------------------
    $scope.$on("$ionicView.enter", function() {
      // Refresh routes on enter for my routes in case we did something that
      // changed my routes e.g. unsubscribing lite route, booking a route
      if ($ionicHistory.currentStateName() === "tabs.yourRoutes") {
        $scope.refreshRoutes(true)
      }
    })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    const autoComplete = function autoComplete() {
      if (!$scope.data.queryText) {
        $scope.data.placeQuery = null
        $scope.data.isFiltering = false
        $scope.$digest()
        return
      }

      // show the spinner
      $scope.data.isFiltering = true
      $scope.$digest()

      // default 'place' object only has 'queryText' but no geometry
      let place = { queryText: $scope.data.queryText }
      SearchEventService.emit("search-item", $scope.data.queryText)

      // Reset routes, crowdstartRoutes and liteRoutes here because they are
      // used to determine whether we do a place query (see watchGroup with
      // all 3)
      // If we don't reset, we could end up with the case where the criteria
      // is applied to the wrong version of them
      // E.g.
      // 1. User makes one search. App completely finishes all filtering.
      // 2. User makes another search.
      // 3. First time we enter watchgroup for routes + crowdstartRoutes, only
      //    only one of them has changed. WLOG assume it is routes.
      // 4. Then routes is filtered from the new search, while crowdstartRoutes
      //    is filtered from the old search.
      // 5. Then the check (routes.length + crowdstartRoutes.length +
      //    liteRoutes.length> 0) is using the wrong version of crowdstartRoutes
      //    and could result in us doing unnecessary place queries.
      //
      // Resetting to null also has the benefit that the check whether we do
      // place queries is only done once.
      $scope.data.routes = null
      $scope.data.crowdstartRoutes = null
      $scope.data.liteRoutes = null
      $scope.data.placeQuery = place
      $scope.$digest()
    }

    $scope.$watch(
      "data.queryText",
      _.debounce(autoComplete, 300, {
        leading: false,
        trailing: true,
      })
    )

    $scope.$watch("data.queryText", queryText => {
      if (queryText.length === 0) $scope.data.isFiltering = true
    })

    // Recent routes
    // Need to pull in the "full" data from all routes
    $scope.$watchGroup(
      [
        () => RoutesService.getRecentRoutes(),
        () => RoutesService.getRoutesWithRoutePass(),
      ],
      ([recentRoutes, allRoutes]) => {
        // If we cant find route data here then proceed with empty
        // This allows it to organically "clear" any state
        if (!recentRoutes || !allRoutes) return

        // "Fill in" the recent routes with the all routes data
        let allRoutesById = _.keyBy(allRoutes, "id")
        $scope.data.recentRoutes = recentRoutes
          .map(recentRoute => {
            return _.assign(
              {
                alightStopStopId: recentRoute.alightStopStopId,
                boardStopStopId: recentRoute.boardStopStopId,
              },
              allRoutesById[recentRoute.id]
            )
            // Clean out "junk" routes which may be old/obsolete
          })
          .filter(route => route && route.id !== undefined)
        $scope.data.recentRoutesById = _.keyBy($scope.data.recentRoutes, "id")
      }
    )

    // Crowdstarted routes
    $scope.$watchGroup(
      [
        () => RoutesService.getRoutesWithRidesRemaining(),
        "data.placeQuery",
        "data.recentRoutesById",
      ],
      ([routes, placeQuery, recentRoutesById]) => {
        // Input validation
        if (!routes) return
        // Filtering
        if (placeQuery && placeQuery.geometry && placeQuery.queryText) {
          routes = SearchService.filterRoutesByPlaceAndText(
            routes,
            placeQuery,
            placeQuery.queryText
          )
        } else if (placeQuery && placeQuery.queryText) {
          routes = SearchService.filterRoutesByText(
            routes,
            placeQuery.queryText
          )
        }
        // Publish
        const recentRouteIds = Object.keys(recentRoutesById || {})
        $scope.data.routesWithRidesRemaining = routes.filter(
          route => !recentRouteIds.map(Number).includes(route.id)
        )
      }
    )

    $scope.$watchGroup(
      [
        () => KickstarterService.getBids(),
        () => KickstarterService.getKickstarterRoutesById(),
      ],
      async ([bids, kickstarterRoutesById]) => {
        if (!bids || !kickstarterRoutesById) return

        const crowdstarts = await Promise.all(
          bids.map(bid => KickstarterService.getCrowdstartById(bid.routeId))
        )
        $scope.data.backedCrowdstartRoutes = crowdstarts.filter(
          route =>
            (!route.passExpired && route.isActived) ||
            !route.isExpired ||
            !route.is7DaysOld
        )
      }
    )

    // pull interested routes based on recently booking
    // assumption on 'AM from' and 'PM to' stop as 'home place / target place'
    // search based on target with radius of 500m
    // reset to null if user use search bar
    $scope.$watchGroup(
      ["data.recentRoutesById", "data.routes"],
      async ([recentRoutesById, routes]) => {
        if (recentRoutesById && routes) {
          let placeResults = []
          for (let id in recentRoutesById) {
            // https://eslint.org/docs/rules/guard-for-in
            if (Object.prototype.hasOwnProperty.call(recentRoutesById, id)) {
              let route = recentRoutesById[id]
              let lnglat = null
              let tripStopsByKey = _.keyBy(
                route.trips[0].tripStops,
                stop => stop.stopId
              )

              let stopId =
                route.startTime && moment(route.startTime).format("A") === "AM"
                  ? route.boardStopStopId
                  : route.alightStopStopId

              if (stopId in tripStopsByKey) {
                lnglat = tripStopsByKey[stopId].stop.coordinates.coordinates
              } else {
                lnglat = await RequestService.beeline({
                  method: "GET",
                  url: "/stops/" + stopId,
                }).then(response => response.data.coordinates.coordinates)
              }

              let results = SearchService.filterRoutesByLngLat(
                $scope.data.routes,
                lnglat
              )
              placeResults = _.concat(placeResults, results)
            }
          }
          // filter recently booked route ids
          _.remove(placeResults, x => {
            return recentRoutesById[x.id]
          })
          // publish unique routes
          $scope.data.routesYouMayLike = _.uniqBy(placeResults, "id")
        }
      }
    )

    // Lite routes
    $scope.$watchGroup(
      [
        () => LiteRoutesService.getLiteRoutes(),
        () => LiteRouteSubscriptionService.getSubscriptionSummary(),
        "data.placeQuery",
      ],
      ([liteRoutes, subscribed, placeQuery]) => {
        // Input validation
        if (!liteRoutes || !subscribed) return
        liteRoutes = Object.values(liteRoutes)

        let subscribedLiteRoutes = _.filter(liteRoutes, route => {
          return !!subscribed.includes(route.label)
        })
        // Sort by label and publish
        $scope.data.subscribedLiteRoutes = _.sortBy(
          subscribedLiteRoutes,
          route => {
            return parseInt(route.label.slice(1))
          }
        )

        // Filtering
        if (placeQuery && placeQuery.geometry && placeQuery.queryText) {
          liteRoutes = SearchService.filterRoutesByPlaceAndText(
            liteRoutes,
            placeQuery,
            placeQuery.queryText
          )
        } else if (placeQuery && placeQuery.queryText) {
          liteRoutes = SearchService.filterRoutesByText(
            liteRoutes,
            placeQuery.queryText
          )
        }
        // Add the subscription information
        _.forEach(liteRoutes, liteRoute => {
          liteRoute.isSubscribed = Boolean(subscribed.includes(liteRoute.label))
        })
        // Sort by label and publish
        $scope.data.liteRoutes = _.sortBy(liteRoutes, route => {
          return parseInt(route.label.slice(1))
        })
      }
    )

    // Normal routes
    // Sort them by start time
    $scope.$watchGroup(
      [
        () => RoutesService.getRoutesWithRoutePass(),
        () => RoutesService.getRoutePassTags(),
        () => RoutesService.getRoutePassExpiries(),
        "data.placeQuery",
      ],
      ([allRoutes, routePassTags, routePassExpiries, placeQuery]) => {
        // Input validation
        if (!allRoutes || !routePassTags || !routePassExpiries) return
        // Filter routes
        if (placeQuery && placeQuery.geometry && placeQuery.queryText) {
          allRoutes = SearchService.filterRoutesByPlaceAndText(
            allRoutes,
            placeQuery,
            placeQuery.queryText
          )
        } else if (placeQuery && placeQuery.queryText) {
          allRoutes = SearchService.filterRoutesByText(
            allRoutes,
            placeQuery.queryText
          )
        }
        // Sort the routes by the time of day
        $scope.data.routes = _.sortBy(allRoutes, "label", route => {
          const firstTripStop = _.get(route, "trips[0].tripStops[0]")
          const midnightOfTrip = new Date(firstTripStop.time.getTime())
          midnightOfTrip.setHours(0, 0, 0, 0)
          return firstTripStop.time.getTime() - midnightOfTrip.getTime()
        })

        $scope.data.routes = $scope.data.routes.map(route => {
          let expiries = {}
          for (let tag of routePassTags[route.id]) {
            _.assign(expiries, routePassExpiries[tag])
          }
          let dates = Object.keys(expiries).map(date => {
            return moment(date)
          })

          dates.sort()

          // Get the closest expiry date
          // Add one day because the route pass expires at the end of the day
          route.expiry = dates[0].add(1, "days").diff(moment(), "days")

          return route
        })
      }
    )

    // Unactivated kickstarter routes
    $scope.$watchGroup(
      [
        () => KickstarterService.getCrowdstart(),
        () => KickstarterService.getBids(),
        "data.placeQuery",
      ],
      ([routes, bids, placeQuery]) => {
        if (!routes || !bids) return

        // Filter out the expired routes
        routes = routes.filter(route => !route.isExpired)

        // Filter out the routes the user bidded on
        // These are already shown elsewhere
        let biddedRouteIds = bids.map(bid => bid.routeId)

        // Filter out routes that have already been bidded on
        routes = routes.filter(route => {
          return !biddedRouteIds.includes(route.id)
        })

        // Filter the routes by search query
        if (placeQuery && placeQuery.geometry && placeQuery.queryText) {
          routes = SearchService.filterRoutesByPlaceAndText(
            routes,
            placeQuery,
            placeQuery.queryText
          )
        } else if (placeQuery && placeQuery.queryText) {
          routes = SearchService.filterRoutesByText(
            routes,
            placeQuery.queryText
          )
        }
        // Map to scope once done
        $scope.data.crowdstartRoutes = routes
      }
    )

    // Deciding whether to do a place query
    $scope.$watchGroup(
      ["data.routes", "data.crowdstartRoutes", "data.liteRoutes"],
      ([routes, crowdstartRoutes, liteRoutes]) => {
        const handlePlaceQuery = async function handlePlaceQuery() {
          // Important comments in the autoComplete function
          if (!routes || !crowdstartRoutes || !liteRoutes) return
          // Criteria for making a place query
          if (routes.length + crowdstartRoutes.length + liteRoutes.length > 0) {
            return
          }

          let placeQuery = $scope.data.placeQuery
          if (!placeQuery) return

          // If placeQuery.geometry exists then we've already made a place query
          if (placeQuery.geometry) return

          let place = await OneMapPlaceService.handleQuery(
            $scope.data.queryText
          )

          // If place is null, setting placeQuery to place will cause the whole
          // list to be displayed
          if (!place) return

          $scope.data.placeQuery = place
          $scope.$digest()
        }

        const stopFilteringAfterDelay = async function stopFilteringAfterDelay() {
          await sleep(500)
          $scope.data.isFiltering = false
          $scope.$digest()
        }

        handlePlaceQuery().then(
          stopFilteringAfterDelay,
          stopFilteringAfterDelay
        )
      }
    )

    let unbindWatchGroup = $scope.$watch(
      () => $scope.hasPersonalRoutes(),
      hasPersonalRoutes => {
        if (
          $ionicHistory.currentStateName() === "tabs.yourRoutes" &&
          !hasPersonalRoutes
        ) {
          // After redirecting once we can unbind the watcher
          unbindWatchGroup()
          $state.go("tabs.routes")
        }
      }
    )

    // Hides the animated loading routes
    $scope.$watchGroup(
      [
        "data.routes",
        "data.routesWithRidesRemaining",
        "data.backedCrowdstartRoutes",
        "data.recentRoutes",
        "data.liteRoutes",
        "data.subscribedLiteRoutes",
        "data.crowdstartRoutes",
        "data.routesYouMayLike",
      ],
      (
        [
          routes,
          routesWithRidesRemaining,
          backedCrowdstartRoutes,
          recentRoutes,
          liteRoutes,
          subscribedLiteRoutes,
          crowdstartRoutes,
          routesYouMayLike,
        ]
      ) => {
        // true iff some route has been loaded and is non-empty OR
        // all routes have been loaded and all are empty

        // Your routes
        if ($ionicHistory.currentStateName() === "tabs.youRoutes") {
          $scope.data.routesAvailable =
            (routesWithRidesRemaining && routesWithRidesRemaining.length > 0) ||
            (recentRoutes && recentRoutes.length > 0) ||
            (subscribedLiteRoutes && subscribedLiteRoutes.length > 0) ||
            (backedCrowdstartRoutes && backedCrowdstartRoutes.length > 0) ||
            (routesYouMayLike && routesYouMayLike.length > 0) ||
            (routesWithRidesRemaining &&
              recentRoutes &&
              subscribedLiteRoutes &&
              backedCrowdstartRoutes &&
              routesYouMayLike)
        } else {
          $scope.data.routesAvailable =
            (routes && routes.length > 0) ||
            (liteRoutes && liteRoutes.length > 0) ||
            (crowdstartRoutes && crowdstartRoutes.length > 0) ||
            (routes && liteRoutes && crowdstartRoutes)
        }
      }
    )

    const routesAreLoaded = function routesAreLoaded() {
      return !!(
        $scope.data.routes &&
        $scope.data.liteRoutes &&
        $scope.data.crowdstartRoutes
      )
    }

    // call $anchorScroll only if all data loaded and there is $location.hash()
    $scope.$watch(
      () => routesAreLoaded(),
      loaded => {
        if (loaded && $location.hash()) {
          $timeout(() => {
            $anchorScroll()
          }, 0)
        }
      }
    )

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    // Manually pull the newest data from the server
    // Report any errors that happen
    // Note that theres no need to update the scope manually
    // since this is done by the service watchers
    $scope.refreshRoutes = function(ignoreCache) {
      RoutesService.fetchRoutePasses(ignoreCache)
      RoutesService.fetchRoutes(ignoreCache)
      const routesPromise = RoutesService.fetchRoutesWithRoutePass()
      const recentRoutesPromise = RoutesService.fetchRecentRoutes(ignoreCache)
      const allLiteRoutesPromise = LiteRoutesService.fetchLiteRoutes(
        ignoreCache
      )
      const crowdstartRoutesPromise = KickstarterService.fetchCrowdstart(
        ignoreCache
      )
      const liteRouteSubscriptionsPromise = LiteRouteSubscriptionService.getSubscriptions(
        ignoreCache
      )
      return $q
        .all([
          routesPromise,
          recentRoutesPromise,
          allLiteRoutesPromise,
          liteRouteSubscriptionsPromise,
          crowdstartRoutesPromise,
        ])
        .then(() => {
          $scope.error = null
        })
        .catch(() => {
          $scope.error = true
        })
        .then(() => {
          $scope.$broadcast("scroll.refreshComplete")
        })
    }

    $scope.hasPersonalRoutes = function() {
      return !(
        $scope.data.routesWithRidesRemaining &&
        $scope.data.routesWithRidesRemaining.length === 0 &&
        $scope.data.recentRoutes &&
        $scope.data.recentRoutes.length === 0 &&
        $scope.data.subscribedLiteRoutes &&
        $scope.data.subscribedLiteRoutes.length === 0 &&
        $scope.data.backedCrowdstartRoutes &&
        $scope.data.backedCrowdstartRoutes.length === 0 &&
        $scope.data.routesYouMayLike &&
        $scope.data.routesYouMayLike.length === 0
      )
    }

    $scope.openSuggestionLink = function(event) {
      event.preventDefault()
      let appName = $rootScope.o.APP.NAME.replace(/\s/g, "")
      window.open(
        "https://www.beeline.sg/suggest.html#" +
          querystring.stringify({ referrer: appName }),
        "_system"
      )
    }
  },
]
