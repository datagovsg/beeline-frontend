import _ from "lodash"

export default function SearchService() {
  // Helper to calculate distance in meters between a pair of coordinates
  // faster but less accurate
  function latlngDistance(ll1, ll2) {
    let rr1 = [ll1[0] / 180 * Math.PI, ll1[1] / 180 * Math.PI]
    let rr2 = [ll2[0] / 180 * Math.PI, ll2[1] / 180 * Math.PI]

    let dx = (rr1[1] - rr2[1]) * Math.cos(0.5 * (rr1[0] + rr2[0]))
    let dy = rr1[0] - rr2[0]

    let dist = Math.sqrt(dx * dx + dy * dy) * 6378137
    return dist
  }

  // Helper to calculate distance in meters between a pair of coordinates
  // let latlngDistance = (ll1, ll2) => {
  //   let lat1 = ll1[0];
  //   let lon1 = ll1[1];
  //   let lat2 = ll2[0];
  //   let lon2 = ll2[1];
  //   var R = 6378.137; // Radius of earth in KM
  //   var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
  //   var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
  //   var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
  //   Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
  //   Math.sin(dLon/2) * Math.sin(dLon/2);
  //   var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  //   var d = R * c;
  //   return d * 1000; // meters
  // };

  return {
    filterRoutesByText: function(routes, string) {
      return routes.filter(route => this.routeContainsString(route, string))
    },

    filterRoutes: function(routes, regionId, string) {
      return this.filterRoutesByText(routes, string)
    },

    filterRoutesByPlace: function(routes, place) {
      const maxDistance = 1000 // Arbitrary constant for closeness

      // Check the trips stops of a route to see if any come close
      let filteredRoutes = routes.filter(route => {
        return _.some(route.trips[0].tripStops, tripStop => {
          let distance = latlngDistance(
            [
              tripStop.stop.coordinates.coordinates[1],
              tripStop.stop.coordinates.coordinates[0],
            ],
            [place.geometry.location.lat(), place.geometry.location.lng()]
          )
          return distance < maxDistance
        })
      })

      return filteredRoutes
    },

    filterRoutesByLngLat: function(routes, lnglat) {
      const maxDistance = 500 // Arbitrary constant for closeness

      // Check the trips stops of a route to see if any come close
      let filteredRoutes = routes.filter(route => {
        return _.some(route.trips[0].tripStops, tripStop => {
          let distance = latlngDistance(
            [
              tripStop.stop.coordinates.coordinates[1],
              tripStop.stop.coordinates.coordinates[0],
            ],
            [lnglat[1], lnglat[0]]
          )
          return distance < maxDistance
        })
      })

      return filteredRoutes
    },

    filterRoutesByPlaceAndText: function(routes, place, text) {
      let placeResults = this.filterRoutesByPlace(routes, place)
      let textResults = this.filterRoutesByText(routes, text)
      return _.unionBy(placeResults, textResults, "id")
    },

    // Input: a Route and a string
    // Output: True if route metatdata contains the string
    routeContainsString: function(route, string) {
      if (!string) return true

      function containsIgnoreCase(s, t) {
        if (typeof s === "string") {
          // If the search phrase (t) is more than one word, just find t in s
          // Otherwise, split s and see if any words in s start with t
          if (t.split(" ").length > 1) {
            return s.toUpperCase().includes(t.toUpperCase())
          } else {
            // Split on non-alphanumeric chars
            let words = s.toUpperCase().split(/[^A-Za-z0-9]/)
            return words.some(word => word.startsWith(t.toUpperCase()))
          }
        } else {
          return false
        }
      }
      return (
        containsIgnoreCase(route.name, string) ||
        containsIgnoreCase(route.notes && route.notes.description, string) ||
        containsIgnoreCase(route.schedule, string) ||
        containsIgnoreCase(route.label, string) ||
        (route.trips[0] &&
          (route.trips[0].tripStops.some(ts =>
            containsIgnoreCase(ts.stop.description, string)
          ) ||
            route.trips[0].tripStops.some(ts =>
              containsIgnoreCase(ts.stop.road, string)
            )))
      )
    },
  }
}
