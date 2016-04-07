'use strict';

export default [
    '$scope',
    '$state',
    '$stateParams',
    '$http',
    'suggestionService',
    'userService',
    'Search',
    '$ionicModal',
function(
    $scope,
    $state,
    $stateParams,
    $http,
    suggestionService,
    userService,
    Search,
    $ionicModal
) {
    $scope.$on('$ionicView.afterEnter', async (event) => {
        /* Entered from the route search */
        if ($state.params.action == 'submit' &&
            Search.data.startLat && Search.data.startLng) {
            $state.params.action = ''

            console.log(userService);
            // submit the suggestion via $https
            userService
            .authenticate()
            .then(() => {
                var arrivalTime = new Date(Search.data.arrivalTime);
                var secondsSinceMidnight = arrivalTime.getHours() * 60*60 +
                        arrivalTime.getMinutes() * 60 +
                        arrivalTime.getSeconds();

                return userService.beeline({
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
            })
            .catch((err) => {
                console.log(err);
                alert('You must be logged in to make a suggestion');
                $state.go('tab.suggest', {action: ''})
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

        userService.beeline({
            url: '/suggestions',
            method: 'GET',
        })
        .then((response) => {
            suggestions = response.data;

            var countSimilar = suggestions.map(suggestion =>
                userService.beeline({
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
            //     $scope.suggestions,
            //     sugg => sugg.id);

            // for (let suggestion of suggestions) {
            //     if (oldSuggestions[sugg.id] &&
            //             oldSuggestion[sugg.id].updatedAt == suggestion.updatedAt) {
            //         _.assign(suggestion, oldSuggestions[sugg.id])
            //     }
            // }
            $scope.suggestions = suggestions;
        });

        suggestionService.getSimilar()
        .then(function () {
            $scope.similarSuggestions = suggestionService.getSimilarSuggestions();
        });

        $scope.getSuggestionById = function(tid){
            suggestionService.getSuggestionById(tid);
            $scope.suggestion = suggestionService.getSelectedSuggestion();
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

    $scope.deleteSuggestion = function(event, id) {
        event.stopPropagation();
        if (confirm("Are you sure you want to delete this suggestion?")) {
            userService.beeline({
                method: 'DELETE',
                url: '/suggestions/' + id
            })
            .then(queryData);
        }
    };
    $scope.promptNewSuggestion = function() {
        if (!$scope.newSuggestionModal) {
            $scope.newSuggestion = {
                time: '',
                startPoint: {},
                endPoint: {},
            };
            $scope.newSuggestionModal = $ionicModal.fromTemplate(
                require('./newSuggestion.html'),
                {
                    scope: $scope,
                    animation: 'slide-in-up'
                }
            )
        }
        $scope.newSuggestionModal.show();
    };
    $scope.submitSuggestion = function (suggestion) {
        userService
        .authenticate()
        .then(() => {
            var arrivalTime = new (
                Date.bind.apply(Date, [{}, 2015, 1, 1].concat(suggestion.time.split(':'))));
            var secondsSinceMidnight = arrivalTime.getHours() * 60*60 +
                    arrivalTime.getMinutes() * 60 +
                    arrivalTime.getSeconds();

            return userService.beeline({
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
