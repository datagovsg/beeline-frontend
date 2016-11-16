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

      function contains(s, t) {
        if (typeof s == 'string') {
          return s.toUpperCase().includes(t.toUpperCase())
        } else {
          return false;
        }
      }
      return contains(route.name, string) ||
        contains(route.notes && route.notes.description, string) ||
        contains(route.schedule, string) ||
        contains(route.label, string) ||
        (route.trips[0] && (
          route.trips[0].tripStops.some(ts => contains(ts.stop.description, string)) ||
          route.trips[0].tripStops.some(ts => contains(ts.stop.road, string))
        )) ||
        route.regions.some(region => contains(region.name, string));
    }

  };
}
