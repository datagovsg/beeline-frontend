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

    filterRoutesByPlace: function(routes, place) {

      const maxDistance = 3000; // Arbitrary constant for closeness

      // Helper to calculate distance in meters between a pair of coordinates
      let latlngDistance = (ll1, ll2) => {
        let lat1 = ll1[0];
        let lon1 = ll1[1];
        let lat2 = ll2[0];
        let lon2 = ll2[1];
        var R = 6378.137; // Radius of earth in KM
        var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
        var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c;
        return d * 1000; // meters
      };

      // Check the trips stops of a route to see if any come close
      let filteredRoutes = routes.filter(route => {
        return _.some(route.trips[0].tripStops, (tripStop) => {
          let distance = latlngDistance(
            tripStop.stop.coordinates.coordinates.reverse(),
            [place.geometry.location.lat(), place.geometry.location.lng()]
          );
          return distance < maxDistance;
        });
      });

      return filteredRoutes;
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
