import _ from "lodash"

let lineSymbol = {
  path: "M 0,-1 0,1",
  strokeOpacity: 1,
  scale: 4,
}
let lineIcons = {
  path: [{ lat: 22.291, lng: 153.027 }, { lat: 18.291, lng: 153.027 }],
  strokeOpacity: 0,
  icons: [
    {
      icon: lineSymbol,
      offset: "0",
      repeat: "20px",
    },
  ],
}
export function dashedLineIcons() {
  return lineIcons
}

export function defaultMapOptions(options) {
  return _.assign(
    {
      center: { latitude: 1.370244, longitude: 103.823315 },
      zoom: 11,
      bounds: {
        // so that autocomplete will mainly search within Singapore
        northeast: {
          latitude: 1.485152,
          longitude: 104.091837,
        },
        southwest: {
          latitude: 1.205764,
          longitude: 103.589899,
        },
      },
      control: {},
      options: {
        disableDefaultUI: true,
        styles: [
          {
            featureType: "poi",
            stylers: [
              {
                visibility: "off",
              },
            ],
          },
        ],
        draggable: true,
      },
      markers: [],
      lines: [],
    },
    options || {}
  )
}

export function retriveNextTrip(route) {
  // compare current date with nearest date trip's 1st board stop time
  let sortedRunningTripInDates = _.sortBy(
    route.trips.filter(tr => tr.isRunning),
    "date"
  )
  let now = Date.now()
  let nextTrip = null
  for (let trip of sortedRunningTripInDates) {
    let sortedTripStopsInTime = _.sortBy(trip.tripStops, "time")
    let boardTime = null
    let lastStopTime = null
    if (trip.bookingInfo.windowSize && trip.bookingInfo.windowType) {
      if (trip.bookingInfo.windowType === "firstStop") {
        boardTime =
          sortedTripStopsInTime[0].time.getTime() + trip.bookingInfo.windowSize
      }
      // FIXME : windowType == "stop"
    }
    // if no booking window information
    if (boardTime == null) {
      boardTime = sortedTripStopsInTime[0].time.getTime()
    }
    // the trip end time
    lastStopTime = sortedTripStopsInTime[
      sortedTripStopsInTime.length - 1
    ].time.getTime()
    // check seat is available
    if (now < boardTime || (now >= boardTime && now <= lastStopTime)) {
      nextTrip = trip
      // assign the boardTime to the Object
      nextTrip.boardTime = boardTime
      break
    }
  }
  return nextTrip
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * onlyOneAtATime(fn)
 *
 * @param {function} fn A function that return a promise.
 * @param {object} options Options
 * @param {object} options.indicatorScope A scope object on which to set an indicator
 * @param {object} options.indicatorVariable A scope object on which to set an indicator
 * @return {function} Function wrapping around fn which ensures
 *  that fn cannot be called until the previous call has resolved/
 *  rejected
 */
export function onlyOneAtATime(fn, options = {}) {
  let currentPromise = null

  const { scope, indicatorVariable } = options

  // eslint-disable-next-line
  /** Wrapper function */
  async function wrapper() {
    if (currentPromise === null) {
      try {
        if (indicatorVariable) {
          _.set(scope, indicatorVariable, true)
        }

        // eslint-disable-next-line
        currentPromise = Promise.resolve(fn.apply(this, arguments))

        return await currentPromise
      } finally {
        currentPromise = null

        if (indicatorVariable) {
          scope.$apply(() => {
            _.set(scope, indicatorVariable, false)
          })
        }
      }
    } else {
      return
    }
  }
  return wrapper
}
