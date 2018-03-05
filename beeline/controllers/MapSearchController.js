import _ from "lodash"

export default [
  "$scope",
  "OneMapPlaceService",
  "SearchService",
  "$state",
  "RoutesFilterService",
  "MapService",
  function(
    $scope,
    OneMapPlaceService,
    SearchService,
    $state,
    RoutesFilterService,
    MapService
  ) {
    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    $scope.data = {
      pickup: null,
      dropoff: null,
      isFiltering: false,
      pickupPlace: null,
      dropoffPlace: null,
    }

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------

    $scope.$watch(
      "data.pickup",
      _.debounce(pickup => placeSearch(pickup, true), 300, {
        leading: false,
        trailing: true,
      })
    )

    $scope.$watch(
      "data.dropoff",
      _.debounce(dropoff => placeSearch(dropoff), 300, {
        leading: false,
        trailing: true,
      })
    )
    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.done = async function() {
      if ($scope.data.pickupPlace && $scope.data.dropoffPlace) {
        $state.go("tabs.searchRoutes", {
          pickup: $scope.data.pickup,
          dropoff: $scope.data.dropoff,
        })
      }
    }

    // ------------------------------------------------------------------------
    // Helper functions
    // ------------------------------------------------------------------------
    async function placeSearch(searchInput, isPickup) {
      let stop, place
      if (!searchInput) {
        stop = place = null
      } else {
        place = await OneMapPlaceService.handleQuery(searchInput)
        if (place) {
          stop = {
            stop: {
              coordinates: {
                coordinates: [
                  Number(place.geometry.location.lng()),
                  Number(place.geometry.location.lat()),
                ],
                type: "Point",
              },
            },
          }
        } else {
          stop = null
        }
      }
      if (isPickup) {
        $scope.data.pickupPlace = place
        MapService.emit("board-stop-selected", stop)
      } else {
        $scope.data.dropoffPlace = place
        MapService.emit("alight-stop-selected", stop)
      }
    }
  },
]
