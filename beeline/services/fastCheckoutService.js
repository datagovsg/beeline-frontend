import moment from "moment"
import { retriveNextTrip } from "../shared/util"
import assert from "assert"

angular.module("beeline").factory("FastCheckoutService", [
  "RoutesService",
  "UserService",
  "purchaseRoutePassService",
  "TicketService",
  "$stateParams",
  "BookingSummaryModalService",
  "$ionicLoading",
  function fastCheckoutService(
    RoutesService,
    UserService,
    purchaseRoutePassService,
    TicketService,
    $stateParams,
    BookingSummaryModalService,
    $ionicLoading
  ) {
    let user
    let hasSavedPaymentInfo
    let paymentInfo
    let ridesRemaining
    let route
    let routeId

    // login
    function userLoginPromise() {
      return new Promise((resolve, reject) => {
        if (UserService.getUser()) {
          return resolve(UserService.getUser())
        } else {
          UserService.promptLogIn().then(user => {
            if (user) return resolve(user)
            else return reject("Not Logged In")
          })
        }
      })
    }

    // ridesRemaining promise
    function ridesRemainingPromise(routeId) {
      return new Promise((resolve, reject) => {
        if (RoutesService.getPassCountForRoute(routeId)) {
          return resolve(RoutesService.getPassCountForRoute(routeId))
        } else {
          RoutesService.fetchRoutesWithRoutePass()
            .then(() => {
              return resolve(RoutesService.getPassCountForRoute(routeId))
            })
            .catch(err => {
              return reject(err)
            })
        }
      })
    }

    //  modal for purchase route pass
    function purchaseRoutePass(
      hideOneTicket,
      route,
      routeId,
      hasSavedPaymentInfo,
      savedPaymentInfo,
      boardStopId,
      alightStopId,
      selectedDates
    ) {
      return purchaseRoutePassService.show(
        hideOneTicket,
        route,
        routeId,
        hasSavedPaymentInfo,
        savedPaymentInfo,
        boardStopId,
        alightStopId,
        selectedDates
      )
    }

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

    function purchaseTicketUsingRoutePass(
      routeId,
      route,
      selectedDates,
      boardStopId,
      alightStopId,
      hasSavedPaymentInfo
    ) {
      return BookingSummaryModalService.show({
        routeId: routeId,
        price: route.trips[0].price,
        route: route,
        applyRoutePass: true,
        selectedDates: selectedDates,
        boardStopId: boardStopId,
        alightStopId: alightStopId,
        hasSavedPaymentInfo: hasSavedPaymentInfo,
      })
    }

    function verifyPromise(routeId) {
      return new Promise(async (resolve, reject) => {
        route = await RoutesService.getRoute(routeId)
        let nextTrip = retriveNextTrip(route)
        if (nextTrip === null) {
          return reject("There is no next trip")
        }
        let seatsAvailable = false
        if (
          nextTrip &&
          nextTrip.availability &&
          nextTrip.availability.seatsAvailable > 0
        ) {
          seatsAvailable = true
        }
        let hasNextTripTicket = null,
          previouslyBookedDays = null
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
            } else {
              hasNextTripTicket = false
            }
          } else {
            hasNextTripTicket = false
          }
        }
        _.assign(nextTrip, { hasNextTripTicket, seatsAvailable })
        if (hasNextTripTicket === true || seatsAvailable === false) {
          nextTrip.errorMessage =
            "Next Trip is not available or user already purchased"
        }
        return resolve(nextTrip)
      })
    }

    let instance = {
      verify: function(routeId) {
        return verifyPromise(routeId)
      },

      buyMore: function(routeId) {
        return new Promise(async (resolve, reject) => {
          try {
            user = await userLoginPromise()
            hasSavedPaymentInfo =
              _.get(user, "savedPaymentInfo.sources.data.length", 0) > 0
            paymentInfo = hasSavedPaymentInfo
              ? _.get(user, "savedPaymentInfo")
              : null
            route = await RoutesService.getRoute(routeId)
            await purchaseRoutePass(
              true,
              route,
              routeId,
              hasSavedPaymentInfo,
              paymentInfo
            )
            return resolve("success")
          } catch (err) {
            console.log(err)
            return reject("failed")
          }
        })
      },

      fastCheckout: function(
        routeId,
        boardStopId,
        alightStopId,
        selectedDates
      ) {
        return new Promise(async (resolve, reject) => {
          try {
            user = await userLoginPromise()
            $ionicLoading.show({
              template: `<ion-spinner icon='crescent'></ion-spinner><br/><small>Loading</small>`,
              hideOnStateChange: true,
            })
            let verifyNextTrip = await verifyPromise(routeId)
            if (verifyNextTrip.errorMessage) {
              return reject(verifyNextTrip.errorMessage)
            }
            hasSavedPaymentInfo =
              _.get(user, "savedPaymentInfo.sources.data.length", 0) > 0
            paymentInfo = hasSavedPaymentInfo
              ? _.get(user, "savedPaymentInfo")
              : null
            route = await RoutesService.getRoute(routeId)
            ridesRemaining = await ridesRemainingPromise(routeId)
            $ionicLoading.hide()
            if (!ridesRemaining) {
              if (route && routeQualifiedForRoutePass(route)) {
                await purchaseRoutePass(
                  false,
                  route,
                  routeId,
                  hasSavedPaymentInfo,
                  paymentInfo,
                  boardStopId,
                  alightStopId,
                  selectedDates
                )
              } else {
                // ask for stripe payment for single ticket
                await BookingSummaryModalService.show({
                  routeId: routeId,
                  price: route.trips[0].price,
                  route: route,
                  applyRoutePass: false,
                  selectedDates: selectedDates,
                  boardStopId: boardStopId,
                  alightStopId: alightStopId,
                  hasSavedPaymentInfo: hasSavedPaymentInfo,
                })
              }
            } else {
              await purchaseTicketUsingRoutePass(
                routeId,
                route,
                selectedDates,
                boardStopId,
                alightStopId,
                hasSavedPaymentInfo
              )
            }
            return resolve("success")
          } catch (err) {
            $ionicLoading.hide()
            console.log(err)
            return reject("failed")
          }
        })
      },

      routeQualifiedForRoutePass: route => routeQualifiedForRoutePass(route),
    }
    return instance
  },
])
