/* eslint-disable require-jsdoc */
import _ from 'lodash'
import commonmark from 'commonmark'

const reader = new commonmark.Parser({ safe: true })
const writer = new commonmark.HtmlRenderer({ safe: true })

/**
 * Render HTML from Markdown using commonmark
 * @param {string} markdown the Markdown to render
 * @return {string} the resulting HTML
 */
export function htmlFrom (markdown) {
  return writer.render(reader.parse(markdown))
}

let lineSymbol = {
  path: 'M 0,-1 0,1',
  strokeOpacity: 1,
  scale: 4,
}
let lineIcons = {
  path: [{ lat: 22.291, lng: 153.027 }, { lat: 18.291, lng: 153.027 }],
  strokeOpacity: 0,
  icons: [
    {
      icon: lineSymbol,
      offset: '0',
      repeat: '20px',
    },
  ],
}
export function dashedLineIcons () {
  return lineIcons
}

export function defaultMapOptions (options) {
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
            featureType: 'poi',
            stylers: [
              {
                visibility: 'off',
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

export function retriveNextTrip (route) {
  // compare current date with nearest date trip's 1st board stop time
  let sortedRunningTripInDates = _.sortBy(
    route.trips.filter(tr => tr.isRunning),
    'date'
  )
  let now = Date.now()
  let nextTrip = null
  for (let trip of sortedRunningTripInDates) {
    let sortedTripStopsInTime = _.sortBy(trip.tripStops, 'time')
    let boardTime = null
    let lastStopTime = null
    if (trip.bookingInfo.windowSize && trip.bookingInfo.windowType) {
      if (trip.bookingInfo.windowType === 'firstStop') {
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

export function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
