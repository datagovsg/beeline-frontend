import _ from 'lodash'
import moment from 'moment'

export default [
  '$scope',
  '$ionicPopup',
  'loadingSpinner',
  'SuggestionService',
  'SharedVariableService',
  function (
    // Angular Tools
    $scope,
    $ionicPopup,
    loadingSpinner,
    SuggestionService,
    SharedVariableService
  ) {
    // ------------------------------------------------------------------------
    // Helper Functions
    // ------------------------------------------------------------------------
    function populateTimes () {
      let time = moment().startOf('day')

      while (time.isBefore(moment().endOf('day'))) {
        $scope.disp.times.push(time.clone())
        time = time.add(30, 'minutes')
      }
    }

    function getLatLng ({ LATITUDE, LONGITUDE }) {
      return {
        lat: parseFloat(LATITUDE),
        lng: parseFloat(LONGITUDE),
      }
    }

    function getDaysOfWeek (days) {
      let obj = {}
      days.map(d => {
        obj[d.text] = d.enabled
      })
      return obj
    }

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    $scope.data = {
      suggestions: null,
      pickUpLocation: null,
      dropOffLocation: null,
      selectedTimeIndex: null,
      selectedTime: null,
      daysInvalid: true,
    }

    $scope.disp = {
      times: [],
    }

    $scope.data.days = [
      {
        text: 'Mon',
        enabled: false,
      },
      {
        text: 'Tue',
        enabled: false,
      },
      {
        text: 'Wed',
        enabled: false,
      },
      {
        text: 'Thu',
        enabled: false,
      },
      {
        text: 'Fri',
        enabled: false,
      },
      {
        text: 'Sat',
        enabled: false,
      },
      {
        text: 'Sun',
        enabled: false,
      },
    ]

    populateTimes()

    // ------------------------------------------------------------------------
    // Ionic events
    // ------------------------------------------------------------------------

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    $scope.$watch('data.selectedTimeIndex', i => {
      if (!i) return
      const hour = $scope.disp.times[i].hour()
      const minutes = $scope.disp.times[i].minute()
      $scope.data.selectedTime = hour * 3600e3 + minutes * 60e3
    })

    $scope.$watch('data.days', days => {
      let invalid = true
      for (let day in days) {
        if (days[day].enabled) {
          invalid = false
          break
        }
      }
      $scope.data.daysInvalid = invalid
    }, true)

    $scope.$watch('data.pickUpLocation', loc => {
      if (!loc) return
      let stop = {
        stop: {
          coordinates: {
            type: 'Point',
            coordinates: [loc.LATITUDE, loc.LONGITUDE],
          },
        },
      }
      SharedVariableService.setBoardStop(stop)
      // $scope.mapObject.boardStop.stop = stop
    })

    $scope.$watch(() => SuggestionService.getSuggestions(), suggestions => {
      $scope.data.suggestions = suggestions
    })

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.popupDeleteConfirmation = function () {
      $ionicPopup.confirm({
        title: 'Are you sure you want to delete the suggestions?',
      })
    }

    $scope.swapFromTo = function () {
      [$scope.data.pickUpLocation, $scope.data.dropOffLocation] = [_.clone($scope.data.dropOffLocation), _.clone($scope.data.pickUpLocation)]
    }

    $scope.submitSuggestion = async function () {
      try {
        await loadingSpinner(
          SuggestionService.createSuggestion(
            getLatLng($scope.data.pickUpLocation),
            getLatLng($scope.data.dropOffLocation),
            $scope.data.selectedTime,
            getDaysOfWeek($scope.data.days)
          )
        )
      } catch (err) {
        await $ionicPopup.alert({
          title: 'Error creating suggestion',
          template: `
          <div> There was an error creating the suggestion. \
          ${err && err.data && err.data.message} Please try again later.</div>
          `,
        })
        // $state.go('tabs.routes')
      }
    }
  },
]
