import _ from 'lodash';

export default function(
  // Angular Tools
  $scope,
  $q,
  // Route Information
  RoutesService,
  KickstarterService,
  LiteRoutesService,
  // Misc
  LiteRouteSubscriptionService,
  SearchService,
  BookingService,
  uiGmapGoogleMapApi,
  LazyLoadService,
  SearchEventService
) {

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  // Explicitly declare/initialize of scope variables we use
  $scope.data = {
    placeQuery: null, // The place object used to search
    queryText: "", // The actual text in the box used only for the clear button
    // Different types of route data
    activatedCrowdstartRoutes: [],
    recentRoutes: [],
    recentRoutesById: null,
    liteRoutes: [],
    routes: [],
    crowdstartRoutes: [],
    nextSessionId: null,
    isFiltering: null,
    routesYouMayLike: []
  };


  uiGmapGoogleMapApi.then((googleMaps) => {
    // Initialize it with google autocompleteService and PlacesService
    let searchBox = document.getElementById('search');
    // Blur on enter
    searchBox.addEventListener("keypress", function(event) {
      if (event.key === "Enter") this.blur();
    });

    $scope.autocompleteService = LazyLoadService(() => new googleMaps.places.AutocompleteService());
    $scope.placesService = LazyLoadService(() => new google.maps.places.PlacesService(searchBox))
  });

  function autoComplete() {
    if (!$scope.data.queryText || !$scope.autocompleteService) {
      $scope.data.isFiltering = false;
      return;
    };
    // show the spinner
    $scope.data.isFiltering = true;
    $scope.$digest();
    // default 'place' object only has 'queryText' but no geometry
    let place = {queryText: $scope.data.queryText};
    SearchEventService.emit('search-item', $scope.data.queryText)

    // Reset routes, crowdstartRoutes and liteRoutes here because they are used to
    // determine whether we do a place query (see watchGroup with all 3)
    // If we don't reset, we could end up with the case where the criteria
    // is applied to the wrong version of them
    // E.g.
    // 1. User makes one search. App completely finishes all filtering.
    // 2. User makes another search.
    // 3. First time we enter watchgroup for routes + crowdstartRoutes, only
    //    only one of them has changed. WLOG assume it is routes.
    // 4. Then routes is filtered from the new search, while crowdstartRoutes
    //    is filtered from the old search.
    // 5. Then the check (routes.length + crowdstartRoutes.length + liteRoutes.length> 0)
    //    is using the wrong version of crowdstartRoutes and could result in us doing
    //    unnecessary place queries.
    //
    // Resetting to null also has the benefit that the check whether we do
    // place queries is only done once.
    $scope.data.routes = null;
    $scope.data.crowdstartRoutes = null;
    $scope.data.liteRoutes = null;
    $scope.data.placeQuery = place;
    $scope.$digest();
  }
  // ---------------------------------------------------------------------------
  // UI Hooks
  // ---------------------------------------------------------------------------

  $scope.$watch('data.queryText',
    _.debounce(autoComplete, 1000, {leading: false, trailing: true})
  )


  // Manually pull the newest data from the server
  // Report any errors that happen
  // Note that theres no need to update the scope manually
  // since this is done by the service watchers
  $scope.refreshRoutes = function (ignoreCache) {
    RoutesService.fetchRoutePasses(ignoreCache);
    RoutesService.fetchRoutes(ignoreCache);
    var routesPromise = RoutesService.fetchRoutesWithRoutePass();
    var recentRoutesPromise = RoutesService.fetchRecentRoutes(ignoreCache);
    var allLiteRoutesPromise = LiteRoutesService.fetchLiteRoutes(ignoreCache);
    var crowdstartRoutesPromise = KickstarterService.fetchCrowdstart(ignoreCache);
    var liteRouteSubscriptionsPromise = LiteRouteSubscriptionService.getSubscriptions(ignoreCache);
    return $q.all([
      routesPromise,
      recentRoutesPromise,
      allLiteRoutesPromise,
      liteRouteSubscriptionsPromise,
      crowdstartRoutesPromise
    ]).then(() => {
      $scope.error = null;
    }).catch(() => {
      $scope.error = true;
    }).then(() => {
      $scope.$broadcast('scroll.refreshComplete');
    })
  };

  $scope.$watch("data.queryText", (queryText) => {
    if (queryText.length === 0) $scope.data.placeQuery = null;
  });

  // ---------------------------------------------------------------------------
  // Model Hooks
  // ---------------------------------------------------------------------------
  // Kickstarted routes
  $scope.$watchGroup(
    [() => RoutesService.getActivatedKickstarterRoutes(), 'data.placeQuery'],
    ([routes, placeQuery]) => {
      // Input validation
      if (!routes) return;
      // Filtering
      if (placeQuery && placeQuery.geometry && placeQuery.queryText) {
        routes = SearchService.filterRoutesByPlaceAndText(
          routes, placeQuery, placeQuery.queryText
        );
      } else if (placeQuery && placeQuery.queryText) {
        routes = SearchService.filterRoutesByText(
          routes, placeQuery.queryText
        );
      }
      // Publish
      $scope.data.activatedCrowdstartRoutes = routes;
    }
  );

  // Recent routes
  // Need to pull in the "full" data from all routes
  $scope.$watchGroup(
    [
      () => RoutesService.getRecentRoutes(),
      () => RoutesService.getRoutesWithRoutePass(),
      'data.placeQuery'
    ],
    ([recentRoutes, allRoutes, placeQuery]) => {
      // If we cant find route data here then proceed with empty
      // This allows it to organically "clear" any state
      if (!recentRoutes || !allRoutes) return;

      // Filtering
      if (placeQuery && placeQuery.geometry && placeQuery.queryText) {
        allRoutes = SearchService.filterRoutesByPlaceAndText(
          allRoutes, placeQuery, placeQuery.queryText
        );
      } else if (placeQuery && placeQuery.queryText) {
        allRoutes = SearchService.filterRoutesByText(
          allRoutes, placeQuery.queryText
        );
      }
      // "Fill in" the recent routes with the all routes data
      let allRoutesById = _.keyBy(allRoutes, 'id');
      $scope.data.recentRoutes = recentRoutes.map( (recentRoute) => {
        return _.assign({
          alightStopStopId: recentRoute.alightStopStopId,
          boardStopStopId: recentRoute.boardStopStopId
        }, allRoutesById[recentRoute.id]);
      // Clean out "junk" routes which may be old/obsolete
      }).filter( (route)=> route && route.id !== undefined);
      $scope.data.recentRoutesById = _.keyBy($scope.data.recentRoutes,'id');
    }
  );

  // blend activatedCrowdstartRoutes and recentRoutes
  $scope.$watchGroup(
    ['data.activatedCrowdstartRoutes', 'data.recentRoutesById'],
    ([activatedCrowdstartRoutes, recentRoutesById]) => {
      if (activatedCrowdstartRoutes && recentRoutesById) {
        let activatedCrowdstartRoutesIds = _.map(activatedCrowdstartRoutes, route => route.id);
        $scope.data.recentRoutes = $scope.data.recentRoutes.filter (
          (route) => !activatedCrowdstartRoutesIds.includes(route.id)
        );
      }
    }
  );

  // pull interested routes based on recently booking
  // assumption on 'AM from' and 'PM to' stop as 'home place / target place'
  // search based on target with radius of 500m
  // reset to null if user use search bar
  $scope.$watchGroup(
    ['data.recentRoutesById', 'data.routes'],
    ([recentRoutesById, routes]) => {
      if (recentRoutesById && routes) {
        let placeResults = [];
        let stop = null
        for (let id in recentRoutesById) {
          let route = recentRoutesById[id]
          let lnglat = null
          let tripStopsByKey = _.keyBy(route.trips[0].tripStops, (stop)=>stop.stopId)
          if (route.schedule && route.schedule.slice(0,2) === 'AM') {
            lnglat = tripStopsByKey[route.boardStopStopId].stop.coordinates.coordinates
          } else {
            lnglat = tripStopsByKey[route.alightStopStopId].stop.coordinates.coordinates
          }
          let results = SearchService.filterRoutesByLngLat($scope.data.routes, lnglat);
          placeResults = _.concat(placeResults, results)
        }
        // filter recently booked route ids
        _.remove(placeResults, (x)=>{
          return recentRoutesById[x.id]
        })
        // publish unique routes
        $scope.data.routesYouMayLike = _.uniqBy(placeResults, 'id')
      }
    }
  )

  // Backed kickstarter routes
  $scope.$watchGroup(
    [
      () => KickstarterService.getCrowdstart(),
      () => KickstarterService.getBids(),
      'data.placeQuery'
    ],
    ([routes, bids, placeQuery]) => {
      if (!routes || !bids) return;

      // Filter to the routes the user bidded on
      let biddedRouteIds = bids.map(bid => bid.routeId);
      routes = routes.filter(route => {
        return biddedRouteIds.includes(route.id.toString());
      });

      // don't display it in backed list if the pass expires after 1 month of 1st trip
      //and don't display it if it's 7 days after expired and not actived
      routes = routes.filter((route)=>(!route.passExpired && route.isActived)
                                        || !route.isExpired || !route.is7DaysOld);

      // Filter the routes
      if (placeQuery && placeQuery.geometry && placeQuery.queryText) {
        routes = SearchService.filterRoutesByPlaceAndText(
          routes, placeQuery, placeQuery.queryText
        );
      } else if (placeQuery && placeQuery.queryText) {
        routes = SearchService.filterRoutesByText(
          routes, placeQuery.queryText
        );
      }
      // Map to scope once done filtering and sorting
      $scope.data.biddedCrowdstartRoutes = _.sortBy(routes, route => {
        return parseInt(route.label.slice(1));
      });
    }
  );

  // Lite routes
  $scope.$watchGroup(
    [
      () => LiteRoutesService.getLiteRoutes(),
      () => LiteRouteSubscriptionService.getSubscriptionSummary(),
      'data.placeQuery'
    ],
    ([liteRoutes, subscribed, placeQuery]) =>{
      // Input validation
      if (!liteRoutes || !subscribed) return;
      liteRoutes = Object.values(liteRoutes);
      // Filtering
      if (placeQuery && placeQuery.geometry && placeQuery.queryText) {
        liteRoutes = SearchService.filterRoutesByPlaceAndText(
          liteRoutes, placeQuery, placeQuery.queryText
        );
      } else if (placeQuery && placeQuery.queryText) {
        liteRoutes = SearchService.filterRoutesByText(
          liteRoutes, placeQuery.queryText
        );
      }
     // Add the subscription information
      _.forEach(liteRoutes, (liteRoute) => {
        liteRoute.isSubscribed = !!subscribed.includes(liteRoute.label);
      });
      // Sort by label and publish
      $scope.data.liteRoutes = _.sortBy(liteRoutes, route => {
        return parseInt(route.label.slice(1));
      });
    }
  )

  // Normal routes
  // Sort them by start time
  $scope.$watchGroup(
    [() => RoutesService.getRoutesWithRoutePass(), "data.placeQuery"],
    ([allRoutes, placeQuery]) => {
      // Input validation
      if (!allRoutes) return;
      // Filter routes
      if (placeQuery && placeQuery.geometry && placeQuery.queryText) {
        allRoutes = SearchService.filterRoutesByPlaceAndText(
          allRoutes, placeQuery, placeQuery.queryText
        );
      } else if (placeQuery && placeQuery.queryText) {
        allRoutes = SearchService.filterRoutesByText(
          allRoutes,
          placeQuery.queryText
        );
      }
      // Sort the routes by the time of day
      $scope.data.routes = _.sortBy(allRoutes, 'label', (route) => {
        var firstTripStop = _.get(route, 'trips[0].tripStops[0]');
        var midnightOfTrip = new Date(firstTripStop.time.getTime());
        midnightOfTrip.setHours(0,0,0,0);
        return firstTripStop.time.getTime() - midnightOfTrip.getTime();
      });
    }
  );

  // Unactivated kickstarter routes
  $scope.$watchGroup(
    [
      () => KickstarterService.getCrowdstart(),
      () => KickstarterService.getBids(),
      'data.placeQuery'
    ],
    ([routes, bids, placeQuery]) => {
      if (!routes || !bids) return;

      // Filter out the routes the user bidded on
      // These are already shown elsewhere
      let biddedRouteIds = bids.map(bid => bid.routeId);
      routes = routes.filter(route => {
        return !biddedRouteIds.includes(route.id.toString());
      });
      // Filter out the expired routes
      routes = routes.filter(route => !route.isExpired);
      // Filter the routes
      if (placeQuery && placeQuery.geometry && placeQuery.queryText) {
        routes = SearchService.filterRoutesByPlaceAndText(
          routes, placeQuery, placeQuery.queryText
        );
      } else if (placeQuery && placeQuery.queryText) {
        routes = SearchService.filterRoutesByText(
          routes, placeQuery.queryText
        );
      }
      // Map to scope once done filtering and sorting
      $scope.data.crowdstartRoutes = _.sortBy(routes, route => {
        return parseInt(route.label.slice(1));
      });
    }
  );

  // Deciding whether to do a place query
  $scope.$watchGroup(
    [
      'data.routes',
      'data.crowdstartRoutes',
      'data.liteRoutes'
    ],
    ([routes, crowdstartRoutes, liteRoutes]) => {
      // Important comments in the autoComplete function
      if (!routes || !crowdstartRoutes || !liteRoutes) return;
      // Criteria for making a place query
      if (routes.length + crowdstartRoutes.length + liteRoutes.length> 0) {
        // Set a small delay to make the spinner appear for slightly longer
        setTimeout(() => {
          $scope.data.isFiltering = false;
          $scope.$digest();
        }, 500);
        return;
      }

      let placeQuery = $scope.data.placeQuery
      if (!placeQuery) return;

      // If placeQuery.geometry exists, then we've already made a place query
      if (placeQuery.geometry) return;

      if (!$scope.autocompleteService) return;

      $scope.autocompleteService().getPlacePredictions({
        componentRestrictions: {country: 'SG'},
        input: $scope.data.queryText
      }, (predictions) => {
        // If no results found then nothing more to do
        if (!predictions || predictions.length === 0) return;

        // Grab the top prediction and get the details
        // Apply the details as the full result
        $scope.placesService().getDetails({
          placeId: predictions[0].place_id
        }, result => {
          // If we fail getting the details then shortcircuit
          if (!result) return;
          // Otherwise return the fully formed place
          let place = {queryText: $scope.data.queryText};
          place = _.assign(place,result);
          // Return the found place
          $scope.data.placeQuery =  place;
          $scope.$digest();

          // Set a small delay to make the spinner appear for slightly longer
          setTimeout(() => {
            $scope.data.isFiltering = false;
            $scope.$digest();
          }, 500);
        });
      })
    }
  )


  // ---------------------------------------------------------------------------
  // Misc
  // ---------------------------------------------------------------------------

  // Session ID cache for some reason?
  // let ionic to clear page cache if user goes through booking process of the
  // same route few times, always start with clean form (pre-chosen stops etc.
  // are cleared),this is the internal mechanism of ionic (as any part of query
  // string change, the cache are cleared)
  $scope.$on('$ionicView.beforeEnter', () => {
    $scope.data.nextSessionId = BookingService.newSession();
  })

}
