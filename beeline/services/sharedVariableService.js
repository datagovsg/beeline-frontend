
angular.module('beeline')
.factory('SharedVariableService',  (RoutesService) => {

  var sharedData = {
    stops: [],
    boardStops: [],
    alightStops: [],
    routePath: [],
  };

  var instance = {
    get: function() {
      return sharedData
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
    }

  }

  return instance;

})
