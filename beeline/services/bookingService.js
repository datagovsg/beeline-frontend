import {NetworkError} from '../shared/errors'
import {formatDate, formatDateMMMdd, formatTime, formatUTCDate} from '../shared/format'

export default function (userService) {
        var rv = {};

        rv.reset = function(routeId) {
            this.routeId = routeId;
            this.routeInfo = null;
            this.lastState = undefined;
            this.currentBooking = null;
        }

        rv.loadRouteInfo = async function ($http) {
            try {
                // don't load if already loaded
                if (this.routeInfo != null && this.routeInfo.id == this.routeId)
                    return;

                // load from http
                try {
                    var resp = await userService.beeline({
                        method: 'GET',
                        url: '/routes/' + this.routeId
                            + '?include_trips=true&include_availability=true',
                    })
                }
                catch (err) {
                    console.log(err.stack);
                    throw new NetworkError('Failed to download route information');
                }

                var route = resp.data;
                this.routeInfo = route;

                // convert dates (should be in ISO format therefore sortable)
                route.trips = _.sortBy(route.trips, trip => trip.date);

                for (let trip of route.trips) {
                    trip.date = new Date(trip.date);
                    for (let tripStop of trip.tripStops) {
                        tripStop.time = new Date(tripStop.time);
                    }
                }

                // summarize trips by date
                route.tripsByDate = {};
                for (let trip of route.trips) {
                    route.tripsByDate[trip.date.getTime()] = trip;
                }


                /**
                    Produce an array of changes.

                    @param trips
                    @param comparable : function (trip : Trip) : T, where T can be compared for changes
                    @param humanReadable : function (before : Trip, after : Trip) : string,
                            A human-readable message telling the user what has changed

                    @returns An array, Each entry consists of an object with
                    the following properties:
                        startDate : Date,
                        endDate: Date,
                        comparable: Result of comparable(trip),
                        humanReadable: Result of humanReadable(before, after)

                */
                function summarizeChanges(trips, comparable, humanReadable) {
                    var changes = [];
                    // var current = {};
                    var lastComparable = undefined;
                    var lastTrip = undefined;

                    for (let trip of trips) {
                        // if (current.startDate == undefined) {
                        //     current.startDate = trip.date;
                        //     current.endDate = trip.date;
                        // }

                        let valueComparable = comparable(trip);
                        if (lastComparable == undefined)
                            lastComparable = valueComparable;

                        if (lastComparable != valueComparable) {
                            let hr = humanReadable(lastTrip, trip);

                            changes.push({
                                startDate: trip.date,
                                humanReadable: hr,
                                comparable: valueComparable,
                            });
                            // current = {
                            //     startDate: trip.date,
                            //     endDate: trip.date,
                            // };
                        }

                        // current.endDate = trip.date;
                        lastTrip = trip;
                        lastComparable = valueComparable;
                    }
                    // if (changes.length != 0) {
                    //     changes.push(current);
                    // }
                    return changes;
                }

                // summarize price/stop/time
                route.priceChanges = summarizeChanges(route.trips,
                    (trip) => trip.price,
                    (bef, aft) => [`Price change from ${bef.price} to ${aft.price}`]);

                route.stopChanges = summarizeChanges(route.trips,
                    trip => trip.tripStops.map(ts => ts.stop.id).join(','),
                    (bef, aft) => {
                        var stopInfo = {};

                        for (let ts of bef.tripStops) {
                            stopInfo[ts.stop.id] = ts.stop;
                        }
                        for (let ts of aft.tripStops) {
                            stopInfo[ts.stop.id] = ts.stop;
                        }

                        var beforeStops = bef.tripStops.map(ts => ts.stop.id);
                        var afterStops = aft.tripStops.map(ts => ts.stop.id);

                        var droppedStops = _.subtract(beforeStops, afterStops);
                        var newStops = _.subtract(afterStops, beforeStops);

                        var messages = [];
                        if (droppedStops.length > 0) {
                            messages.push('Stops '
                                + droppedStops.map(sid => stopInfo[sid].description).join(', ')
                                + ' no longer serviced');
                        }
                        if (newStops.length > 0) {
                            messages.push('New stops '
                                + newStops.map(sid => stopInfo[sid].description).join(', ')
                                + ' added to route');
                        }
                        return messages;
                    });

                route.timeChanges = summarizeChanges(route.trips,
                    trip => trip.tripStops
                                .map(ts => (ts.time.getTime() % (24*60*60*1000)) + ':' + ts.stop.id)
                                .join(','),
                    (bef, aft) => {
                        var messages = [];

                        var befStopInfo = {};
                        var aftStopInfo = {};

                        for (let ts of aft.tripStops) {
                            aftStopInfo[ts.stop.id] = ts;
                        }

                        for (let ts of bef.tripStops) {
                            let befTime = formatTime(new Date(ts.time));
                            let aftTime = formatTime(new Date(aftStopInfo[ts.stop.id].time));

                            messages.push(`Arrival time at stop ${ts.stop.description} changed to ${aftTime}`);
                        }
                        return messages;
                    });
            } catch (err) {
                console.error(err);
            }
        };

		rv.loadTranscoInfo = async function ($http, transcoId) {
			try {
				//load transport company info from http
                try {
                    var resp = await userService.beeline({
                        method: 'GET',
                        url: '/companies/' + transcoId,
                    })

					var transcodata = resp.data;
                }
                catch (err) {
                    console.log(err.stack);
                    throw new NetworkError('Failed to download route information');
                }

				return transcodata;
			} catch (err) {
                console.error(err);
            }
		};

        rv.boardingStop = function () {
            if (!this.currentBooking ||
                !this.currentBooking.selectedDates ||
                !this.currentBooking.selectedDates.length)
                return {};

            return this.routeInfo.tripsByDate[this.currentBooking.selectedDates[0]]
                        .tripStops
                        .filter(ts => this.currentBooking.boardStop == ts.stop.id)[0]
        };
        rv.alightingStop = function() {
            if (!this.currentBooking ||
                !this.currentBooking.selectedDates ||
                !this.currentBooking.selectedDates.length)
                return {};

            return this.routeInfo.tripsByDate[this.currentBooking.selectedDates[0]]
                        .tripStops
                        .filter(ts => this.currentBooking.alightStop == ts.stop.id)[0]
        };

        rv.prepareTrips = function() {
            // create a list of trips
            var trips = [];

            for (let dt of this.currentBooking.selectedDates) {
                trips.push({
                    tripId: this.routeInfo.tripsByDate[dt].id,
                    boardStopId: this.routeInfo.tripsByDate[dt]
                                    .tripStops
                                    .filter(ts => this.currentBooking.boardStop == ts.stop.id)
                                    [0].id,
                    alightStopId: this.routeInfo.tripsByDate[dt]
                                    .tripStops
                                    .filter(ts => this.currentBooking.alightStop == ts.stop.id)
                                    [0].id,
                    qty: this.currentBooking.qty,
                });
            }

			//console.log(trips);
            //console.log(this.routeInfo);

            return trips;
        };

        rv.updatePrice = async function($scope) {
            try {
                console.log('updatePrice');
                if (!this.currentBooking) return;
                else if (!this.currentBooking.selectedDates ||
                        !this.currentBooking.selectedDates.length) {
                    this.currentBooking.priceInfo = {
                        total: 0,
                    };

					//console.log(this.currentBooking);

                    return;
                }
                else {
                    var trips = this.prepareTrips();

                    try {
                        var resp = await userService.beeline({
                            method: 'POST',
                            url: '/transactions/ticket_sale',
                            data: {
                                trips: trips,
                                dryRun: true,
                            },
                        });
                        $scope.$apply(() => {
                            // Find the 'payment' entry in the list of transaction items

                            var txItems = _.groupBy(resp.data.transactionItems, 'itemType');

                            // FIXME: include discounts, vouchers
                            this.currentBooking.priceInfo = {
                                totalDue: txItems.payment[0].debit,
                                tripCount: trips.length,
                                pricesPerTrip: this.summarizePrices(),
                            };
                        });
                    }catch (err) {
                        console.log(err.stack);
                        throw new Error("Invalid status...");
                    }
                }

				//console.log(this.currentBooking);
            }
            catch (err) {
                console.error(err);
            }
        };

        rv.summarizePrices = function() {
            if (!this.currentBooking.selectedDates) {
                return [];
            }

            var dates = _.sortBy(this.currentBooking.selectedDates);

            if (dates.length == 0) return [];

            var current = {}
            var rv = [current];

            for (let dt of dates) {
                if (!current.startDate) {
                    current.startDate = dt;
                }
                if (!current.price) {
                    current.price = this.routeInfo.tripsByDate[dt].price;
                }

                if (current.price != this.routeInfo.tripsByDate[dt].price) {
                    current = {
                        startDate: dt,
                        price: this.routeInfo.tripsByDate[dt].price,
                    };
                    rv.push(current);
                }
                current.endDate = dt;
            }
            //console.log(rv);
            return rv;
        };

        rv.reset(1);

        return rv;
    }
