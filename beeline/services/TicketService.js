import _ from 'lodash';
import assert from 'assert';
import querystring from 'querystring';

export default ['$http', '$filter', 'UserService', 'p',
  function TicketService($http, $filter, UserService, p) {
    var ticketsCache = null;
    var allTickets = null;
    var ticketsByRouteId = null;

    //set to true with setShouldRefreshTickets once a ticket is bought
    //set to false once getCategorizedTickets is called
    var shouldRefreshTickets = false;

    UserService.userEvents.on('userChanged', () => {
      fetchTickets(true)
    })

    function fetchTickets(ignoreCache) {
      if (ticketsCache && !ignoreCache) return ticketsCache;
      var url = '/tickets';
      if (p.transportCompanyId) {
        url += '?'+querystring.stringify({transportCompanyId: p.transportCompanyId})
      }
      return ticketsCache = UserService.beeline({
        method: 'GET',
        url: url,
      }).then((response) => {
        ticketsByRouteId = _.groupBy(response.data, ticket => ticket.boardStop.trip.routeId);
        return allTickets = response.data;
      });
    }

    return {

      getShouldRefreshTickets: function() {
        return shouldRefreshTickets;
      },

      setShouldRefreshTickets: function() {
        shouldRefreshTickets = true;
      },

      fetchTickets: fetchTickets,

      getTickets: function(){
        return allTickets
      },

      getTicketsByRouteId(rid, ignoreCache) {
        return this.fetchTickets(ignoreCache)
        .then(() => {
          return ticketsByRouteId[rid];
        });
      },

      fetchPreviouslyBookedDaysByRouteId: function(rid, ignoreCache) {
        return this.getTicketsByRouteId(rid, ignoreCache)
        .then((tickets) => {
          var dates =  _.keyBy(tickets, t => new Date(t.boardStop.trip.date).getTime()) || {};
          return dates;
        })
      },

      getTicketById: function(id, ignoreCache) {
        assert.equal(typeof id, 'number');
        return this.fetchTickets(ignoreCache).then(function(tickets) {
          return _.find(tickets, {id: id});
        });
      },

      getCategorizedTickets: function(ignoreCache) {
        shouldRefreshTickets = false;
        return this.fetchTickets(ignoreCache).then(function(tickets) {
          var now = new Date();
          var lastMidnight = now.setHours(0, 0, 0, 0);
          var nextMidnight = now.setHours(24, 0, 0, 0);
          var categorizedTickets = {};
          categorizedTickets.today = tickets.filter(function(ticket) {
            return ticket.boardStop !== null &&
                   Date.parse(ticket.boardStop.time) >= lastMidnight &&
                   Date.parse(ticket.boardStop.time) < nextMidnight;
          });
          categorizedTickets.afterToday = tickets.filter(function(ticket) {
            return ticket.boardStop !== null &&
                   Date.parse(ticket.boardStop.time) >= nextMidnight;
          });
          return categorizedTickets;
        });
  		},

      hasNextTripTicket: function(routeId, nextTripDateInMills) {
        return this.fetchPreviouslyBookedDaysByRouteId(routeId)
          .then((dates) => {
            return dates && _.includes(dates, nextTripDateInMills)
          })
      }
    };
}]
