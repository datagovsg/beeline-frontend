export default function TicketService($http,$filter,UserService) {
        var now = new Date();
        var today0000 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0).getTime();
        var today2400 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 24, 0).getTime();
        var tickets = [];
        var todaydata = [];
        var soondata = [];
        var todayDate = [];
        var selectedticket = null;

        return {
            getTickets: function(){
                var bearer = UserService.sessionToken;
                if (!bearer){
                    return Promise.resolve([]);
                }
                return $http.get("http://staging.beeline.sg/tickets", {
                        headers: {
                        "Authorization": 'Bearer '+bearer
                        //"Authorization": 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidXNlciIsInVzZXJJZCI6MSwiaWF0IjoxNDU2Mzk2MTU4fQ.eCgMcdrhZAWfWcQ3hhcYts9oyQetZ4prGGf4t5xEAwU'
                        }
                    }).then((response) => {
                        tickets = response.data;
                        return tickets;
                    });

            },
            getTicketById: function(id){
                for(var i=0;i<tickets.length;i++){
                    if(tickets[i].id == id){
                        console.log("found ticket 1");
                        return tickets[i];
                    }
                }
                return null;
            },

            splitTickets: function() {
                todaydata = tickets.filter(ts=> ts.boardStop!== null && new Date(ts.boardStop.time).getTime() > today0000 && new Date(ts.boardStop.time).getTime() < today2400);
                soondata = tickets.filter(ts=> ts.boardStop!== null && new Date(ts.boardStop.time).getTime() >= today2400);
            },
            todayTickets: function() {
                return todaydata;
            },

            soonTickets: function() {
                return soondata;
            },

            get: function(ticketId) {
              for (var i = 0; i < todaydata.length; i++) {
                if (todaydata[i].id === ticketId) {
                  return todaydata[i];
                }
              }
              for (var i = 0; i < soondata.length; i++) {
                if (soondata[i].id === ticketId) {
                  return soondata[i];
                }
              }
              return null;
            },

            setSelectedTicket: function(ticketId) {
				for (var i = 0; i < tickets.length; i++) {
					if (tickets[i].id === ticketId) {
						selectedticket = tickets[i];
					}
				}
            },

            getSelectedTicket: function() {
                //need to handle if null
                return selectedticket;
            }
        };
    }
