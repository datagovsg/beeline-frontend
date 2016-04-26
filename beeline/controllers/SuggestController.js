
export default [
  '$scope',
  '$state',
  '$stateParams',
  '$http',
  'SuggestionService',
  'UserService',
  '$ionicModal',
  '$ionicPopup',
function(
  $scope,
  $state,
  $stateParams,
  $http,
  SuggestionService,
  UserService,
  $ionicModal,
  $ionicPopup
) {
  $scope.user = null;

  $scope.newSuggestion = {
    time: '',
    startPoint: {},
    endPoint: {},
    control: {},
  };
  $scope.newSuggestionModal = $ionicModal.fromTemplate(
    require('./newSuggestion.html'),
    {
      scope: $scope,
      animation: 'slide-in-up'
    }
  )

  $scope.$on('destroy', () => {
    $scope.newSuggestionModal.destroy();
  })

  $scope.$on('$ionicView.afterEnter', (event) => {

    // if we had anonymous suggestions before, convert them to suggestions
    // associated with this user
    $scope.$watch(function() {
      return Userservice.getUser();
    }, function(newUser) {
      if (newUser) {
        UserService.beeline({
          method: 'POST',
          url: '/suggestions/deanonymize',
        })
        .then((response) => {
          if (response.data > 0) queryData();
        });
      }
    });

    /* Entered from the route search */
    if ($state.params.action == 'submit' &&
      Search.data.startLat && Search.data.startLng) {
      $state.params.action = ''

      var arrivalTime = new Date(Search.data.arrivalTime);
      var secondsSinceMidnight = arrivalTime.getHours() * 60*60 +
          arrivalTime.getMinutes() * 60 +
          arrivalTime.getSeconds();

      UserService.beeline({
        method: 'POST',
        url: '/suggestions',
        data: {
          boardLat: Search.data.startLat,
          boardLon: Search.data.startLng,
          alightLat: Search.data.endLat,
          alightLon: Search.data.endLng,
          time: secondsSinceMidnight,
        }
      })
      .then(() => {
        queryData()
      })
      .catch((err) => {
        console.log(err);
        alert('You must be logged in to make a suggestion');
        $state.go('tabs.suggest', {action: ''})
      });
    }
    else if ($state.params.action == 'new') {
      $scope.promptNewSuggestion();
      queryData();
    }
    else {
      queryData()
    }
  });

  // populate
  function queryData() {
    var suggestions;

    UserService.beeline({
      url: '/suggestions',
      method: 'GET',
    })
    .then((response) => {
      suggestions = response.data;

      var countSimilar = suggestions.map(suggestion =>
        UserService.beeline({
          url: `/suggestions/${suggestion.id}/similar`,
          method: 'GET'
        }))

      return Promise.all(countSimilar);
    })
    .then((similars) => {
      for (var i=0; i<suggestions.length; i++) {
        suggestions[i].numSimilar = similars[i].data.length
      }
      return suggestions;
    })
    .then(function (suggestions) {
      /* Need to map the old suggestions to the new suggestions so
      that we don't lose the geocoding */
      // var oldSuggestions = _.keyBy(
      //   $scope.suggestions,
      //   sugg => sugg.id);

      // for (let suggestion of suggestions) {
      //   if (oldSuggestions[sugg.id] &&
      //       oldSuggestion[sugg.id].updatedAt == suggestion.updatedAt) {
      //     _.assign(suggestion, oldSuggestions[sugg.id])
      //   }
      // }
      $scope.suggestions = suggestions;
    });

    SuggestionService.getSimilar()
    .then(function () {
      $scope.similarSuggestions = SuggestionService.getSimilarSuggestions();
    });

    $scope.getSuggestionById = function(tid){
      SuggestionService.getSuggestionById(tid);
      $scope.suggestion = SuggestionService.getSelectedSuggestion();
      console.log("selected suggestion is "+$scope.suggestion.id);
    }
  }

  $scope.toggleSelected = function(item) {
    if ($scope.selectedItem == item) {
      $scope.selectedItem  = null;
    }
    else {
      $scope.selectedItem = item;
    }
  }

  $scope.selectItem = function(item) {
    // Show a modal
    $scope.newSuggestion.title = 'Your Suggestion'
    $scope.newSuggestion.id = item.id;
    $scope.newSuggestion.startPoint.coordinates = {
      latitude: item.board.coordinates[1],
      longitude: item.board.coordinates[0],
    };
    $scope.newSuggestion.startPoint.text = item.board.description1;
    $scope.newSuggestion.endPoint.coordinates = {
      latitude: item.alight.coordinates[1],
      longitude: item.alight.coordinates[0],
    };
    $scope.newSuggestion.endPoint.text = item.alight.description1;
    $scope.newSuggestion.disabled = true;
    $scope.newSuggestion.setPoint = null;
    $scope.newSuggestionModal.show()
    .then(() => {
      $scope.newSuggestion.control.fitToPoints();
    });
  }

  $scope.deleteSuggestion = function(event, id) {
    event.stopPropagation();
    $ionicPopup.confirm({
      title: 'Delete suggestion',
      template: 'Are you sure you want to delete this suggestion?'
    })
    .then((result) => {
      if (result) {
        UserService.beeline({
          method: 'DELETE',
          url: '/suggestions/' + id
        })
        .then(queryData);
      }
    })
  };
  $scope.promptNewSuggestion = function() {
    $scope.newSuggestion.title = 'New Suggestion'
    $scope.newSuggestion.time = ''
    $scope.newSuggestion.id = false
    $scope.newSuggestion.startPoint.coordinates = null;
    $scope.newSuggestion.startPoint.text = ''
    $scope.newSuggestion.endPoint.coordinates = null;
    $scope.newSuggestion.endPoint.text = ''
    $scope.newSuggestion.setPoint = 'start';
    $scope.newSuggestion.disabled = false;
    $scope.newSuggestionModal.show()
    .then(() => {
      $scope.newSuggestion.control.fitToPoints();
    });
  };
  $scope.submitSuggestion = function (suggestion) {
    var arrivalTime = new (
      Date.bind.apply(Date, [{}, 2015, 1, 1].concat(suggestion.time.split(':'))));
    var secondsSinceMidnight = arrivalTime.getHours() * 60*60 +
        arrivalTime.getMinutes() * 60 +
        arrivalTime.getSeconds();

    return UserService.beeline({
      method: 'POST',
      url: '/suggestions',
      data: {
        boardLat:  suggestion.startPoint.coordinates.latitude,
        boardLon:  suggestion.startPoint.coordinates.longitude,
        alightLat: suggestion.endPoint.coordinates.latitude,
        alightLon: suggestion.endPoint.coordinates.longitude,
        time: secondsSinceMidnight,
      }
    })
    .catch(() => alert('Your suggestion could not be submitted'))
    .then(() => {
      queryData();
      $scope.newSuggestionModal.hide();
    });
  };
  $scope.cancel = function (suggestion) {
    $scope.newSuggestionModal.hide();
  };
}];
