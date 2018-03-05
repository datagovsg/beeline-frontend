angular.module("beeline").factory("RoutesFilterService", [
  "RoutesService",
  "KickstarterService",
  "LiteRoutesService",
  "OneMapPlaceService",
  "SearchService",
  function RoutesFilterService(
    RoutesService,
    KickstarterService,
    LiteRoutesService,
    OneMapPlaceService,
    SearchService
  ) {
    const distance = 1000

    function filter(routes, pickupPlace, dropoffPlace) {
      let routesFrom = SearchService.filterRoutesByPickupPlace(
        distance,
        routes,
        pickupPlace
      )
      let routesTo = SearchService.filterRoutesByDropoffPlace(
        distance,
        routes,
        dropoffPlace
      )
      return _.intersection(routesFrom, routesTo)
    }

    return {
      filterByPickupDropoff: async function(pickup, dropoff) {
        if (pickup && dropoff) {
          let [pickupPlace, dropoffPlace] = await Promise.all([
            OneMapPlaceService.handleQuery(pickup),
            OneMapPlaceService.handleQuery(dropoff),
          ])

          if (!pickupPlace || !dropoffPlace) return

          let routes = await RoutesService.fetchRoutes()
          // filter out expired ones
          let crowdstartRoutes = (await KickstarterService.fetchCrowdstart()).filter(
            route => !route.isExpired
          )
          let liteRoutes = Object.values(
            await LiteRoutesService.fetchLiteRoutes()
          )

          let filteredRoutes = filter(routes, pickupPlace, dropoffPlace)
          let filteredCrowdstart = filter(
            crowdstartRoutes,
            pickupPlace,
            dropoffPlace
          )
          let filteredLite = filter(liteRoutes, pickupPlace, dropoffPlace)
          return [filteredRoutes, filteredCrowdstart, filteredLite]
        }
      },
    }
  },
])
