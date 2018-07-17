import _ from 'lodash'
import moment from 'moment'

export default [
  '$scope',
  '$stateParams',
  'MapService',
  function (
    $scope,
    $stateParams,
    MapService,
  ) {
    // ------------------------------------------------------------------------
    // Helper functions
    // ------------------------------------------------------------------------
    const populateTimes = function populateTimes () {
      let time = moment().startOf('day')

      while (time.isBefore(moment().endOf('day'))) {
        $scope.disp.times.push(time.clone())
        time = time.add(30, 'minutes')
      }
    }

    const emitStop = function emitStop (location, stopType) {
      if (!location) return

      let lat = parseFloat(location.originalObject.LATITUDE)
      let lng = parseFloat(location.originalObject.LONGITUDE)

      if (isNaN(lat) || isNaN(lng)) return

      let stop = {
        coordinates: {
          coordinates: [lng, lat],
          type: 'Point',
        },
      }

      MapService.emit(stopType, { stop })
    }

    // ------------------------------------------------------------------------
    // stateParams
    // ------------------------------------------------------------------------

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    $scope.data = {
      pickUpLocation: null,
      dropOffLocation: null,
      destinationTime: null,
      selectedTimeIndex: null,
      selectedTime: null,
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
    // Ionic Events
    // ------------------------------------------------------------------------

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    $scope.$watch('data.pickUpLocation', location => {
      emitStop(location, 'board-stop-selected')
    })

    $scope.$watch('data.dropOffLocation', location => {
      emitStop(location, 'alight-stop-selected')
    })

    // Using this because I can't seem to figure out how to pass the momentjs
    // object through
    $scope.$watch('data.selectedTimeIndex', i => {
      $scope.data.selectedTime = $scope.disp.times[i]
    })

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.submit = () => {
      console.log($scope.data.days)
    }
  },
]
