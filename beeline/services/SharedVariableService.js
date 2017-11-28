angular.module("beeline").factory("SharedVariableService", [
  "RoutesService",
  RoutesService => {
    let sharedData = {
      stops: [],
      boardStops: [],
      alightStops: [],
      routePath: [],
      actualPath: [],
      boardStop: null,
      alightStop: null,
      liteTripStops: [],
      pingTrips: [],
      chosenStop: null,
    }

    let instance = {
      get: function() {
        return sharedData
      },

      set: function(mapObject) {
        sharedData = _.assign(sharedData, mapObject)
      },

      setStops: function(stops) {
        sharedData.stops = stops
      },

      setBoardStops: function(boardStops) {
        sharedData.boardStops = boardStops
      },

      setAlightStops: function(alightStops) {
        sharedData.alightStops = alightStops
      },

      setRoutePath: function(routePath) {
        sharedData.routePath = routePath
      },

      setBoardStop: function(boardStop) {
        sharedData.boardStop = boardStop
      },

      setAlightStop: function(alightStop) {
        sharedData.alightStop = alightStop
      },

      setLiteTripStops: function(liteTripStops) {
        sharedData.liteTripStops = liteTripStops
      },

      setPingTrips: function(pingTrips) {
        sharedData.pingTrips = pingTrips
      },

      setChosenStop: function(chosenStop) {
        sharedData.chosenStop = chosenStop
      },
    }

    return instance
  },
])
