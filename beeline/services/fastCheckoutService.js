import moment from 'moment';
import {retriveNextTrip} from '../shared/util'

angular.module('beeline')
.factory('FastCheckoutService', function fastCheckoutService(RoutesService, UserService,
    purchaseRoutePassService, TicketService, $stateParams, BookingSummaryModalService) {

    var user;
    var hasSavedPaymentInfo;
    var paymentInfo;
    var ridesRemaining;
    var route;
    var routeId;

    // login
    function userLoginPromise() {
      return new Promise((resolve,reject) => {
        if (UserService.getUser()) {
          return resolve(UserService.getUser())
        } else {
          UserService.promptLogIn().then((user) => {
            if (user) return resolve(user)
            else return reject('Not Logged In')
          })
        }
      })
    }

    // ridesRemaining promise
    function ridesRemainingPromise(routeId) {
      return new Promise((resolve,reject) => {
        if (RoutesService.getPassCountForRoute(routeId)) {
          return resolve(RoutesService.getPassCountForRoute(routeId))
        } else {
          RoutesService.fetchRoutesWithRoutePass().then(() => {
            return resolve(RoutesService.getPassCountForRoute(routeId))
          }).catch((err) =>{
            return reject(err)
          })
        }
      })
    }

    //  modal for purchase route pass
    function purchaseRoutePass(route, routeId, hasSavedPaymentInfo, savedPaymentInfo, selectedDates, boardStopId, alightStopId) {
      return purchaseRoutePassService.show(route, routeId, hasSavedPaymentInfo, savedPaymentInfo, selectedDates, boardStopId, alightStopId)
    }


    function routeQualifiedForRoutePass(route) {
      if (route && route.tags) {
        var rpList = route.tags.filter((tag) => tag.includes('rp-'))
        return rpList && rpList.length === 1 && route.notes && route.notes.passSizes && route.notes.passSizes.length > 0
      }
    }

    function purchaseTicketUsingRoutePass(routeId, selectedDates, boardStopId, alightStopId) {
      return BookingSummaryModalService.show({
        routeId: routeId,
        price: route.trips[0].price,
        route: route,
        applyRoutePass: true,
        selectedDates: selectedDates,
        boardStopId: boardStopId,
        alightStopId: alightStopId,
        hasSavedPaymentInfo: hasSavedPaymentInfo
      })
    }

     function verifyPromise(routeId) {
      return new Promise(async (resolve, reject) => {
        route = await RoutesService.getRoute(routeId)
        var nextTrip = retriveNextTrip(route)
        if (nextTrip === null) {
          return reject('There is no next trip')
        }
        var seatsAvailable = false
        if (nextTrip && nextTrip.availability && nextTrip.availability.seatsAvailable >= 0) {
          seatsAvailable = true
        }
        var hasNextTripTicket = null, previouslyBookedDays = null
        // user has the next trip ticket
        if (UserService.getUser()) {
          var allTickets = TicketService.getTickets();
          if (allTickets != null) {
            var ticketsByRouteId = _.groupBy(allTickets, ticket => ticket.boardStop.trip.routeId);
            if (ticketsByRouteId && ticketsByRouteId[route.id]) {
              previouslyBookedDays =  _.keyBy(ticketsByRouteId[route.id], t => new Date(t.boardStop.trip.date).getTime());
            }
          }
          if (previouslyBookedDays) {
            var bookedDays = Object.keys(previouslyBookedDays).map(x=>{return parseInt(x)});
            //compare current date with next trip
            if (nextTrip && _.includes(bookedDays,nextTrip.date.getTime())) {
              hasNextTripTicket = true;
            } else {
              hasNextTripTicket = false;
            }
          } else {
            hasNextTripTicket = false;
          }
        }
        _.assign(nextTrip, {hasNextTripTicket, seatsAvailable})
        if (hasNextTripTicket === true || seatsAvailable === false) {
          nextTrip.errorMessage = "Next Trip is not available or user already purchased"
        }
        return resolve(nextTrip)
      })
    }

    var instance = {

      verify: function (routeId) {
        return verifyPromise(routeId)
      },

      fastCheckout: function (routeId, boardStopId, alightStopId, selectedDates) {
        return new Promise(async (resolve, reject) => {
          try {
            user = await userLoginPromise()
            let verifyNextTrip = await verifyPromise(routeId)
            if (verifyNextTrip.errorMessage) {
              return reject(verifyNextTrip.errorMessage)
            }
            hasSavedPaymentInfo = _.get(user, 'savedPaymentInfo.sources.data.length', 0) > 0
            paymentInfo = hasSavedPaymentInfo ? _.get(user, 'savedPaymentInfo') : null
            route = await RoutesService.getRoute(routeId)
            ridesRemaining = await ridesRemainingPromise(routeId)
            if (!ridesRemaining) {
              // if route has rp- tag
              if (route && routeQualifiedForRoutePass(route)) {
                // show the modal to purchase route pass
                await purchaseRoutePass(route, routeId, hasSavedPaymentInfo, paymentInfo, selectedDates, boardStopId, alightStopId)
                // await purchaseTicketUsingRoutePass(routeId, selectedDates, boardStopId, alightStopId)
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
                    hasSavedPaymentInfo: hasSavedPaymentInfo
                  })
              }
            } else {
              await purchaseTicketUsingRoutePass(routeId, selectedDates, boardStopId, alightStopId)
            }
            return resolve('success')
          }
          catch (err) {
            console.log(err)
            return reject('failed')
          }
        })
      },
    }
    return instance;

})
