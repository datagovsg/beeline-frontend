export default function SearchService() {
  return {

    // Returns a new array with routes matching the given regionId
    // If regionId is undefined then returns a new array with all the same routes
    filterRoutesByRegionId: function(routes, regionId) {
      return _.filter(routes, function(route) {
        if (regionId) return _.some(route.regions, {'id': regionId});
        else return true;
      });
    },

    filterRoutesByText: function(routes, string) {
      return routes.filter(route => this.routeContainsString(route, string));
    },

    filterRoutes: function(routes, regionId, string) {
      return this.filterRoutesByText(this.filterRoutesByRegionId(routes, regionId), string)
    },

    // Input: a Route and a string
    // Output: True if route metatdata contains the string
    routeContainsString: function(route, string) {
      if (!string) return true;

      function containsIgnoreCase(s, t) {
        if (typeof s == 'string') {
          return s.toUpperCase().includes(t.toUpperCase())
        } else {
          return false;
        }
      }
      return containsIgnoreCase(route.name, string) ||
        containsIgnoreCase(route.notes && route.notes.description, string) ||
        containsIgnoreCase(route.schedule, string) ||
        containsIgnoreCase(route.label, string) ||
        (route.trips[0] && (
          route.trips[0].tripStops.some(ts => containsIgnoreCase(ts.stop.description, string)) ||
          route.trips[0].tripStops.some(ts => containsIgnoreCase(ts.stop.road, string))
        )) ||
        route.regions.some(region => containsIgnoreCase(region.name, string));
    }

  };
}
