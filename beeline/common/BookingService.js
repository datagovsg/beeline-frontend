import { timeSinceMidnight } from "../shared/format"
import _ from "lodash"

angular.module("common").service("BookingService", [
  "RequestService",
  function BookingService(RequestService) {
    this.getTripsFromBooking = function(booking) {
      return booking.selectedDates.map(dt => {
        return {
          tripId: booking.route.tripsByDate[dt].id,
          boardStopId: booking.route.tripsByDate[dt].tripStops.filter(
            ts => booking.boardStopId == ts.stop.id
          )[0].id,
          alightStopId: booking.route.tripsByDate[dt].tripStops.filter(
            ts => booking.alightStopId == ts.stop.id
          )[0].id,
        }
      })
    }

    /* If a booking has selectedDates array, then it
      checks the prices.
    */
    this.computePriceInfo = function(booking) {
      if (!booking.selectedDates || booking.selectedDates.length == 0) {
        return Promise.resolve({
          total: 0,
        })
      } else {
        let trips = this.getTripsFromBooking(booking)

        let rv = RequestService.beeline({
          method: "POST",
          url: "/transactions/tickets/quote",
          data: {
            trips: trips,
            dryRun: true,
            promoCode: { code: booking.promoCode || "" },
            applyRoutePass: !!booking.applyRoutePass,
            groupItemsByType: true,
          },
        })
          .then(resp => {
            return {
              ...resp.data.transactionItems,
              totals: resp.data.totals,
            }
          })
          .then(null, err => {
            console.error(err.stack)
            throw err
          })

        return rv
      }
    }

    this.summarizePrices = function(booking) {
      if (!booking.selectedDates) {
        return []
      }

      let dates = _.sortBy(booking.selectedDates)

      if (dates.length === 0) return []

      return dates.map(dt => {
        return {
          startDate: dt,
          price: booking.route.tripsByDate[dt].price,
          bookingInfo: booking.route.tripsByDate[dt].bookingInfo,
        }
      })
    }

    this.getStopsFromTrips = function(trips) {
      let tripStops = _.flatten(trips.map(trip => trip.tripStops))
      let uniqueStops = _.uniqBy(tripStops, ts => ts.stop.id)

      let boardStops = _(uniqueStops)
        .filter(ts => ts.canBoard)
        .map(ts => {
          return _.extend(
            {
              canBoard: true,
              time: ts.time,
              timeSinceMidnight: timeSinceMidnight(ts.time),
            },
            ts.stop
          )
        })
        .orderBy(s => s.timeSinceMidnight)
        .value()
      let alightStops = _(uniqueStops)
        .filter(ts => ts.canAlight)
        .map(ts => {
          return _.extend(
            {
              canBoard: false,
              time: ts.time,
              timeSinceMidnight: timeSinceMidnight(ts.time),
            },
            ts.stop
          )
        })
        .orderBy(s => s.timeSinceMidnight)
        .value()
      return [boardStops, alightStops]
    }
  },
])
