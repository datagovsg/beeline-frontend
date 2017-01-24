import _ from 'lodash';
import assert from 'assert';

export default function TicketService($http, $filter, UserService) {
  var ticketsCache = null;
  var allTickets = null;
  var ticketsByRouteId = null;

  //set to true with setShouldRefreshTickets once a ticket is bought
  //set to false once getCategorizedTickets is called
  var shouldRefreshTickets = false;

  return {

    getShouldRefreshTickets: function() {
      return shouldRefreshTickets;
    },

    setShouldRefreshTickets: function() {
      shouldRefreshTickets = true;
    },

    fetchTickets: function(ignoreCache) {
      if (ticketsCache && !ignoreCache) return ticketsCache;
      return ticketsCache = UserService.beeline({
        method: 'GET',
        url: '/tickets',
      }).then((response) => {
        ticketsByRouteId = _.groupBy(response.data, ticket => ticket.boardStop.trip.routeId);
        return allTickets = response.data;
			});
    },

    getTickets: function(){
      return allTickets
    },

    getTicketsByRouteId(rid, ignoreCache) {
      return this.fetchTickets(ignoreCache)
      .then(() => {
        return ticketsByRouteId[rid];
      });
    },

    getPreviouslyBookedDaysByRouteId(rid, ignoreCache) {
      return this.getTicketsByRouteId(rid, ignoreCache)
      .then((tickets) => {
        var dates =  _.keyBy(tickets, t => new Date(t.boardStop.trip.date).getTime());
        return dates || {};
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
		}
  };
}
