import moment from 'moment'
import _ from 'lodash'

export default [
  '$scope',
  '$state',
  '$stateParams',
  '$ionicPopup',
  'loadingSpinner',
  'UserService',
  'MapService',
  'SuggestionService',
  'SharedVariableService',
  function (
    // Angular Tools
    $scope,
    $state,
    $stateParams,
    $ionicPopup,
    loadingSpinner,
    UserService,
    MapService,
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

    function getDescription (loc) {
      let { ADDRESS, BLK_NO, BUILDING, POSTAL, ROAD_NAME } = loc
      let postalStr = POSTAL.toLowerCase() === 'nil' ? null : 'S(' + POSTAL + ')'
      return {
        description: [BLK_NO, ROAD_NAME, BUILDING, postalStr].filter(s => s && s.toLowerCase() !== 'nil').join(', '),
        postalCode: !POSTAL || POSTAL.toLowerCase() === 'nil' ? null : POSTAL,
        oneMapData: { ADDRESS, BLK_NO, BUILDING, POSTAL, ROAD_NAME },
      }
    }

    function getDaysOfWeek (days) {
      let obj = {}
      days.map(d => {
        obj[d.text] = d.enabled
      })
      return obj
    }

    function parseLatLngStringArr (arr) {
      return arr.map(a => parseFloat(a))
    }

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    $scope.data = {
      pickUpLocation: $stateParams.pickUpLocation,
      dropOffLocation: $stateParams.dropOffLocation,
      // TODO: change to int after upgrading to ionic 1.3.3
      selectedTimeIndex: '17', // 8.30 am
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
    // Reset all fields on leaving create-new-suggestion page
    // after creating a new suggestion
    $scope.$on('$ionicView.leave', function () {
      $scope.resetSuggestion()
    })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------
    $scope.$watch(
      () => UserService.getUser(),
      async user => {
        $scope.isLoggedIn = Boolean(user)
        $scope.user = user
      }
    )

    $scope.$watch('data.selectedTimeIndex', i => {
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
      if (loc) {
        const stop = {
          coordinates: {
            type: 'Point',
            coordinates: [
              parseFloat(loc.LONGITUDE),
              parseFloat(loc.LATITUDE),
            ],
          },
        }
        MapService.emit('board-stop-selected', { stop: stop })
      } else {
        MapService.emit('board-stop-selected', null)
      }
    })

    $scope.$watch('data.dropOffLocation', loc => {
      if (loc) {
        const stop = {
          coordinates: {
            type: 'Point',
            coordinates: [
              parseFloat(loc.LONGITUDE),
              parseFloat(loc.LATITUDE),
            ],
          },
        }
        MapService.emit('alight-stop-selected', { stop: stop })
      } else {
        MapService.emit('alight-stop-selected', null)
      }
    })

    $scope.$watchGroup(
      ['data.pickUpLocation', 'data.dropOffLocation'],
      ([board, alight]) => {
        if (!board || !alight) {
          MapService.emit('draw-curved-path', null)
        } else {
          MapService.emit('draw-curved-path', {
            board: {
              lat: parseFloat(board.LATITUDE),
              lng: parseFloat(board.LONGITUDE),
            },
            alight: {
              lat: parseFloat(alight.LATITUDE),
              lng: parseFloat(alight.LONGITUDE),
            },
          })
        }
      }
    )

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------
    $scope.login = function () {
      UserService.promptLogIn()
    }

    $scope.resetSuggestion = function () {
      $scope.data.pickUpLocation = null
      $scope.data.dropOffLocation = null
      // TODO: change to int after upgrading to ionic 1.3.3
      $scope.data.selectedTimeIndex = '17' // 8.30 am
      $scope.data.daysInvalid = true
      $scope.data.days = $scope.data.days.map(d => {
        return { ...d, enabled: false }
      })
    }

    $scope.checkExistingDuplicateSuggestions = async function () {
      const suggestions = SuggestionService.getSuggestions()
      const match = _.filter(suggestions, s => {
        let board = $scope.data.pickUpLocation
        let alight = $scope.data.dropOffLocation

        return _.isEqual(s.board.coordinates, parseLatLngStringArr([board.LONGITUDE, board.LATITUDE])) &&
          _.isEqual(s.alight.coordinates, parseLatLngStringArr([alight.LONGITUDE, alight.LATITUDE])) &&
          s.time === $scope.data.selectedTime &&
          _.isEqual(s.daysOfWeek, getDaysOfWeek($scope.data.days))
      })

      if (match.length > 0) {
        await $ionicPopup.alert({
          title: 'Error creating suggestion',
          template: `
          <div>You have already submitted a duplicate suggestion!</div>
          `,
        })
      }

      return match.length > 0
    }

    $scope.submitSuggestion = async function () {
      try {
        const duplicate = await $scope.checkExistingDuplicateSuggestions()
        if (duplicate) return
        const data = await loadingSpinner(
          SuggestionService.createSuggestion(
            getLatLng($scope.data.pickUpLocation),
            getDescription($scope.data.pickUpLocation),
            getLatLng($scope.data.dropOffLocation),
            getDescription($scope.data.dropOffLocation),
            $scope.data.selectedTime,
            getDaysOfWeek($scope.data.days)
          )
        )
        $state.go('tabs.your-suggestion-detail', {
          suggestionId: data.id,
        })
        $scope.refreshSuggestions()
      } catch (err) {
        await $ionicPopup.alert({
          title: 'Error creating suggestion',
          template: `
          <div> There was an error creating the suggestion. \
          ${err && err.data && err.data.message} Please try again later.</div>
          `,
        })
        $state.go('tabs.your-suggestions')
      }
    }

    $scope.refreshSuggestions = async function () {
      await loadingSpinner(SuggestionService.fetchSuggestions())
    }
  },
]
