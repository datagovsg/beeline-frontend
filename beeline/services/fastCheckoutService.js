import { retriveNextTrip } from "../shared/util"
import _ from "lodash"

angular.module("beeline").factory("FastCheckoutService", [
  "RoutesService",
  "UserService",
  "purchaseRoutePassService",
  "TicketService",
  "$ionicLoading",
  function fastCheckoutService(
    RoutesService,
    UserService,
    purchaseRoutePassService,
    TicketService,
    $ionicLoading
  ) {
    function routeQualifiedForRoutePass(route) {
      if (route && route.tags) {
        let rpList = route.tags.filter(tag => tag.includes("rp-"))
        return (
          rpList &&
          rpList.length === 1 &&
          route.notes &&
          route.notes.passSizes &&
          route.notes.passSizes.length > 0
        )
      }
    }

    function verify(routeId) {
      return new Promise(async (resolve, reject) => {
        let route = await RoutesService.getRoute(routeId)
        let nextTrip = retriveNextTrip(route)
        if (nextTrip === null) {
          return reject("There is no next trip")
        }
        let seatsAvailable =
          nextTrip &&
          nextTrip.availability &&
          nextTrip.availability.seatsAvailable > 0
        let hasNextTripTicket = null
        let previouslyBookedDays = null
        let nextTripTicketId = null
        // user has the next trip ticket
        if (UserService.getUser()) {
          let allTickets = TicketService.getTickets()
          if (allTickets != null) {
            let ticketsByRouteId = _.groupBy(
              allTickets,
              ticket => ticket.boardStop.trip.routeId
            )
            if (ticketsByRouteId && ticketsByRouteId[route.id]) {
              previouslyBookedDays = _.keyBy(ticketsByRouteId[route.id], t =>
                new Date(t.boardStop.trip.date).getTime()
              )
            }
          }
          if (previouslyBookedDays) {
            let bookedDays = Object.keys(previouslyBookedDays).map(x => {
              return parseInt(x)
            })
            // compare current date with next trip
            if (nextTrip && _.includes(bookedDays, nextTrip.date.getTime())) {
              hasNextTripTicket = true
              nextTripTicketId =
                previouslyBookedDays[nextTrip.date.getTime()].id
            } else {
              hasNextTripTicket = false
            }
          } else {
            hasNextTripTicket = false
          }
        }
        _.assign(nextTrip, {
          hasNextTripTicket,
          seatsAvailable,
          nextTripTicketId,
        })
        if (hasNextTripTicket === true || seatsAvailable === false) {
          nextTrip.errorMessage =
            "Next Trip is not available or user already purchased"
        }
        return resolve(nextTrip)
      })
    }

    return {
      verify,
      routeQualifiedForRoutePass,
      buyMoreRoutePasses: function(routeId) {
        return new Promise(async (resolve, reject) => {
          try {
            let user = await UserService.loginIfNeeded()
            let hasSavedPaymentInfo =
              _.get(user, "savedPaymentInfo.sources.data.length", 0) > 0
            let paymentInfo = hasSavedPaymentInfo
              ? _.get(user, "savedPaymentInfo")
              : null
            let route = await RoutesService.getRoute(routeId)
            await purchaseRoutePassService.show(
              true,
              route,
              routeId,
              hasSavedPaymentInfo,
              paymentInfo
            )
            return resolve("success")
          } catch (err) {
            console.error(err)
            return reject("failed")
          }
        })
      },
    }
  },
])
