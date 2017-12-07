const moment = require("moment")
import _ from "lodash"
import tapToSelectMultipleDaysTemplate from "../templates/tap-to-select-multiple-days.html"

export default [
  "$scope",
  "UserService",
  "RoutesService",
  "$stateParams",
  "TicketService",
  "loadingSpinner",
  "$q",
  "$ionicScrollDelegate",
  "$ionicPopup",
  "$window",
  function(
    $scope,
    UserService,
    RoutesService,
    $stateParams,
    TicketService,
    loadingSpinner,
    $q,
    $ionicScrollDelegate,
    $ionicPopup,
    $window
  ) {
    // Booking session logic.
    // Defines the set of variables that, when changed, all user inputs
    // on this page should be cleared.
    $scope.session = {
      sessionId: $stateParams.sessionId,
      userId: null,
    }
    // Data logic;
    $scope.book = {
      routeId: Number($stateParams.routeId),
      route: null,
      boardStopId: parseInt($stateParams.boardStop),
      alightStopId: parseInt($stateParams.alightStop),
      priceInfo: {},
      selectedDates: ($stateParams.selectedDates || "")
        .split(",")
        .map(ms => parseInt(ms)),
      invalidStopDates: [],
      applyRoutePass: false,
      applyReferralCredits: false,
      applyCredits: false,
      creditTag: null,
      pickWholeMonth: null,
    }
    // Display Logic;
    $scope.disp = {
      month: moment(),
      validDates: [],
      soldOutDates: [],
      bookedDates: [],
      today: moment(),
      availabilityDays: undefined,
      previouslyBookedDays: undefined,
      highlightDays: [],
      daysAllowed: [],
      selectedDatesMoments: [],
    }

    const routePromise = loadRoutes()
    let multipleDatePopup = null

    const ridesRemainingPromise = RoutesService.fetchRoutePassCount()
    $q.all([routePromise, ridesRemainingPromise]).then(function(values) {
      let ridesRemainingMap = values[1]
      $scope.book.route.ridesRemaining = ridesRemainingMap[$scope.book.routeId]
    })

    $scope.$watch(
      () => UserService.getUser(),
      user => {
        loadTickets()
        $scope.book.applyReferralCredits = Boolean(user)
        $scope.book.applyCredits = Boolean(user)
      }
    )

    $scope.$watch(
      /* Don't watch the entire moment objects, just their value */
      () => $scope.disp.selectedDatesMoments.map(m => m.valueOf()),
      () => {
        // multiple-date-picker gives us the
        // date in midnight local time
        // Need to convert to UTC
        $scope.book.selectedDates = $scope.disp.selectedDatesMoments.map(m =>
          m.valueOf()
        )
      },
      true
    )

    $scope.$watchGroup(
      ["disp.availabilityDays", "disp.previouslyBookedDays"],
      ([availabilityDays, previouslyBookedDays]) => {
        $scope.disp.highlightDays = []
        $scope.disp.daysAllowed = []

        if (!availabilityDays || !previouslyBookedDays) {
          return
        }

        for (let time of Object.keys($scope.disp.availabilityDays)) {
          time = parseInt(time)
          let timeMoment = moment(time).utcOffset(0)
          let trip = $scope.book.route.tripsByDate[time]
          let annotation = trip.bookingInfo && trip.bookingInfo.notes && " "
          if (time in $scope.disp.previouslyBookedDays) {
            $scope.disp.highlightDays.push({
              date: timeMoment,
              css: "previously-booked",
              selectable: false,
              annotation: annotation,
            })
          } else if ($scope.disp.availabilityDays[time] <= 0) {
            $scope.disp.highlightDays.push({
              date: timeMoment,
              css: "sold-out",
              selectable: false,
              annotation: annotation,
            })
          } else {
            $scope.disp.highlightDays.push({
              date: timeMoment,
              css: "",
              selectable: true,
              annotation: annotation,
            })
            $scope.disp.daysAllowed.push(timeMoment)
          }
        }

        $scope.disp.selectedDatesMoments = _.intersectionBy(
          $scope.disp.selectedDatesMoments,
          $scope.disp.daysAllowed,
          m => m.valueOf()
        )
      }
    )

    $scope.$on("priceCalculator.done", () => {
      $ionicScrollDelegate.resize()
    })

    function loadTickets() {
      const ticketsPromise = TicketService.fetchPreviouslyBookedDaysByRouteId(
        $scope.book.routeId,
        true
      ).catch(err => null)

      loadingSpinner(
        $q.all([ticketsPromise]).then(([tickets]) => {
          $scope.disp.previouslyBookedDays = tickets || {}
        })
      )
    }

    function loadRoutes() {
      const routePromise = RoutesService.getRoute($scope.book.routeId, true)
      return loadingSpinner(
        routePromise.then(route => {
          // Route
          $scope.book.route = route
          updateCalendar() // updates availabilityDays
          return route
        })
      )
    }

    function updateCalendar() {
      // ensure cancelled trips are not shown
      const runningTrips = $scope.book.route.trips.filter(tr => tr.isRunning)

      // discover which month to show. Use UTC timezone
      $scope.disp.month = moment(
        _.min(runningTrips.map(t => t.date))
      ).utcOffset(0)

      // reset
      $scope.disp.availabilityDays = {}

      // booking window restriction
      const now = Date.now()

      for (let trip of runningTrips) {
        // FIXME: disable today if past the booking window

        // Make it available, only if the stop is valid for this trip
        let stopIds = trip.tripStops
          .filter(t => t.time.getTime() > now)
          .map(ts => ts.stop.id)
        if (
          stopIds.indexOf($scope.book.boardStopId) === -1 ||
          stopIds.indexOf($scope.book.alightStopId) === -1
        ) {
          continue
        }

        $scope.disp.availabilityDays[trip.date.getTime()] =
          trip.availability.seatsAvailable
      }
    }

    function showHelpPopup() {
      multipleDatePopup = $ionicPopup.show({
        title: "Tap to select multiple days",
        template: tapToSelectMultipleDaysTemplate,
        buttons: [
          {
            text: "OK",
            type: "button-positive",
            onTap: function(e) {
              closePopup()
            },
          },
        ],
      })
    }

    function closePopup() {
      multipleDatePopup.close()
    }

    if (!$window.localStorage.showMultipleDays) {
      $window.localStorage.showMultipleDays = true
      showHelpPopup()
    }

    $scope.$watch("book.pickWholeMonth", pickWholeMonth => {
      // original value
      if (pickWholeMonth === null) {
        $scope.disp.selectedDatesMoments = ($stateParams.selectedDates || "")
          .split(",")
          .map(ms => moment(parseInt(ms)))
      } else {
        let wholeMonthDates = getFullMonthDates($scope.disp.month)
        let allowedInWholeMonth = _.intersectionBy(
          wholeMonthDates,
          $scope.disp.daysAllowed,
          m => m.valueOf()
        )
        if (pickWholeMonth) {
          if ($scope.disp.selectedDatesMoments.length > 0) {
            $scope.disp.selectedDatesMoments = _.unionBy(
              $scope.disp.selectedDatesMoments,
              allowedInWholeMonth,
              m => m.valueOf()
            )
          } else {
            $scope.disp.selectedDatesMoments = allowedInWholeMonth
          }
        } else {
          // pickWholeMonth == false
          // try to test the intersectionBy, if the same
          // length [pickWholeMonth changes from true to false]
          // do differenceBy otherwise omit
          let intersection = _.intersectionBy(
            $scope.disp.selectedDatesMoments,
            wholeMonthDates,
            m => m.valueOf()
          )
          if (allowedInWholeMonth.length === intersection.length) {
            $scope.disp.selectedDatesMoments = _.differenceBy(
              $scope.disp.selectedDatesMoments,
              wholeMonthDates,
              m => m.valueOf()
            )
          } // else do nothing
        }
      }
    })

    $scope.logMonthChanged = function(newMonth, oldMonth) {
      // if wholeMonthDates are all in selectedDatesMoments
      // mark pickWholeMonth = true , otherwise false
      let wholeMonthDates = getFullMonthDates(newMonth)
      let allowedInWholeMonth = _.intersectionBy(
        wholeMonthDates,
        $scope.disp.daysAllowed,
        m => m.valueOf()
      )
      let intersection = _.intersectionBy(
        $scope.disp.selectedDatesMoments,
        allowedInWholeMonth,
        m => m.valueOf()
      )
      $scope.book.pickWholeMonth =
        allowedInWholeMonth.length === intersection.length &&
        allowedInWholeMonth.length > 0
    }

    // get whole range of dates in the month
    function getFullMonthDates(oneUTCDateInMonth) {
      // Tue Aug 23 2444 08:00:00 GMT+0800 (SGT)
      let endOfMonth = moment(oneUTCDateInMonth).endOf("month")
      let lastDate = endOfMonth.date()
      let fullMonthDates = []
      for (let i = 1; i <= lastDate; i++) {
        let candidate = moment.utc([endOfMonth.year(), endOfMonth.month(), i])
        fullMonthDates.push(candidate)
      }
      return fullMonthDates
    }
  },
]
