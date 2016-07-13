import _ from 'lodash';
import assert from 'assert';

export default function TicketService($http, $filter, UserService) {
  var ticketsCache = null;
  var ticketsByRouteId = null;
  return {

    getTickets: function(ignoreCache) {
      if (ticketsCache && !ignoreCache) return ticketsCache;
      return ticketsCache = UserService.beeline({
        method: 'GET',
        url: '/tickets',
      }).then((response) => {
        ticketsByRouteId = _.groupBy(response.data, ticket => ticket.boardStop.trip.routeId);
        return response.data;
			});
    },

    getTicketsByRouteId(rid, ignoreCache) {
      return this.getTickets(ignoreCache)
      .then(() => {
        return ticketsByRouteId[rid];
      });
    },

    getPreviouslyBookedDaysByRouteId(rid, ignoreCache) {
      console.log("ticketsCache is "+ignoreCache)
      return this.getTicketsByRouteId(rid, ignoreCache)
      .then((tickets) => {
        var dates =  _.keyBy(tickets, t => new Date(t.boardStop.trip.date).getTime());
        console.log(dates);
        return dates || {};
      })
    },

    getTicketById: function(id, ignoreCache) {
      assert.equal(typeof id, 'number');
      return this.getTickets(ignoreCache).then(function(tickets) {
        return _.find(tickets, {id: id});
      });
    },

    getCategorizedTickets: function(ignoreCache) {
      return this.getTickets(ignoreCache).then(function(tickets) {
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
