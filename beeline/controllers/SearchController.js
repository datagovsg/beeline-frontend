import _ from 'lodash';
import querystring from 'querystring';

export default function($scope, $state, $stateParams, $http, SuggestionService,
  UserService, $ionicModal, $ionicPopup, MapOptions) {

  $scope.map = MapOptions.defaultMapOptions()

  $scope.disp = { active: null, latestRequest: null }

  $scope.focus = (which) => $scope.disp.active = which;
  $scope.blur = (which) => {}; //$scope.disp.active = null;

  $scope.map.events.dragend = function () {
    var a = $scope.disp.active;
    if (!a) return;
    $scope.disp.showCrosshair = true;
  }
  $scope.useCenter = function () {
    var a = $scope.disp.active;
    var center = $scope.map.control.getGMap().getCenter();

    $scope.data[a] = {
      latitude: center.lat(),
      longitude: center.lng(),
    }

    $scope.data[`${a}Text`] = `${center.lat()}, ${center.lng()}`

    var promise = $scope.disp.latestRequest = UserService.beeline({
      url: '/onemap/revgeocode?' + querystring.stringify({
        location: `${center.lng()},${center.lat()}`
      })
    })
    .then(result => {
      // A new request has come in, so we don't bother with this
      if (promise !== $scope.disp.latestRequest) return;

      var r = result.data;

      if (r.GeocodeInfo[0].ErrorMessage) {
        throw new Error(r.GeocodeInfo[0].ErrorMessage)
      } else {
        $scope.data[`${a}Text`] = [r.GeocodeInfo[0].BUILDINGNAME, r.GeocodeInfo[0].ROAD]
              .filter(x => x)
              .join(', ');
      }
    })
    .catch(err => {
      console.error(err);
    })
    .finally(() => {
      if (promise !== $scope.disp.latestRequest) return;

      $scope.disp.latestRequest = null;
      $scope.disp.active = null;
      $scope.disp.showCrosshair = false;
    })
  }

  $scope.data = {
    originText: '',
    destinationText: '',

    origin: null,
    destination: null,
  }

  $scope.updatePlace = function (which, place) {
    const location = _.get(place, 'geometry.location')

    if (!location) {
      $scope.data[which] = null
    } else {
      $scope.data[which] = {
        latitude: location.lat(),
        longitude: location.lng(),
      };
    }
  }

  $scope.goSearch = function() {
    $state.go('tabs.search-results', {
      originLat: $scope.data.origin.latitude,
      originLng: $scope.data.origin.longitude,
      destinationLat: $scope.data.destination.latitude,
      destinationLng: $scope.data.destination.longitude,
    })
  }
};
