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
            // creditTag: booking.applyRoutePass ? booking.creditTag : null,
            trips: trips,
            dryRun: true,
            promoCode: booking.promoCode
              ? {
                  code: booking.promoCode,
                }
              : {
                  code: "", // Allow default promo codes to be used
                },
            applyCredits: booking.applyCredits,
            applyReferralCredits: booking.applyReferralCredits,
            applyRoutePass: !!booking.applyRoutePass,
          },
        })
          .then(resp => {
            // Find the 'payment' entry in the list of transaction itemss
            let txItems = _.groupBy(resp.data.transactionItems, "itemType")
            let totalBeforeDiscount = _.reduce(
              txItems.ticketSale,
              (sum, n) => {
                return sum + parseFloat(n.credit)
              },
              0
            )

            // FIXME: include discounts, vouchers
            return {
              totalDue: txItems.payment[0].debit,
              tripCount: trips.length,
              pricesPerTrip: this.summarizePrices(booking),
              routePass: txItems["routePass"],
              referralCredits: txItems["referralCredits"],
              credits: txItems["userCredit"],
              discounts: txItems.discount,
              totalBeforeDiscount,
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
