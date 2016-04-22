import _ from 'lodash';

export default function TicketService($http,$filter,UserService) {
    var ticketsCache = null;
    return {

      getTickets: function(ignoreCache) {
        if (ticketsCache && !ignoreCache) {
          return Promise.resolve(ticketsCache);
        }
        return UserService.beeline({
          method: 'GET',
          url: '/tickets',
        }).then((response) => {
          ticketsCache = response.data;
          return ticketsCache;
        });
      },

      getTicketById: function(id, ignoreCache) {
        return this.getTickets(ignoreCache).then((tickets) => {
          return _.find(tickets, function(ticket) { return ticket.id === id; });
        });
      },

      getCategorizedTickets: function(ignoreCache) {
        return this.getTickets(ignoreCache).then((tickets) => {
          var now = new Date();
          var lastMidnight = now.setHours(0,0,0,0);
          var nextMidnight = now.setHours(24,0,0,0);
          var categorizedTickets = {};
          categorizedTickets.today = tickets.filter(ticket => ticket.boardStop!== null &&
                                                    new Date(ticket.boardStop.time).getTime() >= lastMidnight && 
                                                    new Date(ticket.boardStop.time).getTime() < nextMidnight);
          categorizedTickets.afterToday = tickets.filter(ticket => ticket.boardStop!== null && 
                                                         new Date(ticket.boardStop.time).getTime() >= nextMidnight);
          return categorizedTickets;
        });
      }

    };
  }
