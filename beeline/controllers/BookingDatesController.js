const moment = require("moment")
import _ from "lodash"
import tapToSelectMultipleDaysTemplate from "../templates/tap-to-select-multiple-days.html"

export default [
  "$ionicScrollDelegate",
  "$ionicPopup",
  "$q",
  "$scope",
  "$stateParams",
  "$window",
  "loadingSpinner",
  "RoutesService",
  "TicketService",
  "UserService",
  function(
    $ionicScrollDelegate,
    $ionicPopup,
    $q,
    $scope,
    $stateParams,
    $window,
    loadingSpinner,
    RoutesService,
    TicketService,
    UserService
  ) {
    // ------------------------------------------------------------------------
    // stateParams
    // ------------------------------------------------------------------------
    let routeId = $stateParams.routeId ? Number($stateParams.routeId) : null
    let boardStopId = $stateParams.boardStop
      ? parseInt($stateParams.boardStop)
      : null
    let alightStopId = $stateParams.alightStop
      ? parseInt($stateParams.alightStop)
      : null

    // ------------------------------------------------------------------------
    // Data Initialization
    // ------------------------------------------------------------------------
    // Data logic;
    $scope.book = {
      routeId,
      route: null,
      boardStopId,
      alightStopId,
      priceInfo: {},
      selectedDates: [],
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
      selectedDatesMoments: ($stateParams.selectedDates || "")
        .split(",")
        .map(ms => moment(parseInt(ms))),
    }

    // ------------------------------------------------------------------------
    // Helper functions
    // ------------------------------------------------------------------------

    const loadTickets = function loadTickets() {
      const ticketsPromise = TicketService.fetchPreviouslyBookedDaysByRouteId(
        routeId,
        true
      ).catch(err => null)

      loadingSpinner(
        $q.all([ticketsPromise]).then(([tickets]) => {
          $scope.disp.previouslyBookedDays = tickets || {}
        })
      )
    }

    const loadRoutes = function loadRoutes() {
      const routePromise = RoutesService.getRoute(routeId, true)
      return loadingSpinner(
        routePromise.then(route => {
          // Route
          $scope.book.route = route
          updateCalendar() // updates availabilityDays
          return route
        })
      )
    }

    const updateCalendar = function updateCalendar() {
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

    const showHelpPopup = function showHelpPopup() {
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

    const closePopup = function closePopup() {
      multipleDatePopup.close()
    }

    // get whole range of dates in the month
    const getFullMonthDates = function getFullMonthDates(oneUTCDateInMonth) {
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

    // ------------------------------------------------------------------------
    // Data Loading
    // ------------------------------------------------------------------------
    let multipleDatePopup = null
    const routePromise = loadRoutes()
    const ridesRemainingPromise = RoutesService.fetchRoutePassCount()
    $q.all([routePromise, ridesRemainingPromise]).then(function(values) {
      let ridesRemainingMap = values[1]
      $scope.book.route.ridesRemaining = ridesRemainingMap[routeId]
    })

    // ------------------------------------------------------------------------
    // Ionic events
    // ------------------------------------------------------------------------
    // always load the tickets and reset pickWholeMonth & selectedDatesMoments
    // in case of view history
    // e.g. booking-stop => booking.dates => booking.summary => booking.dates => booking.stop
    $scope.$on("$ionicView.enter", function() {
      $scope.book.pickWholeMonth = null
      $scope.disp.selectedDatesMoments = ($stateParams.selectedDates || "")
        .split(",")
        .map(ms => moment(parseInt(ms)))
      loadTickets()
    })

    // ------------------------------------------------------------------------
    // Watchers
    // ------------------------------------------------------------------------

    $scope.$watch(
      () => UserService.getUser(),
      user => {
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

    // ------------------------------------------------------------------------
    // UI Hooks
    // ------------------------------------------------------------------------

    if (!$window.localStorage.showMultipleDays) {
      $window.localStorage.showMultipleDays = true
      showHelpPopup()
    }

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
  },
]
