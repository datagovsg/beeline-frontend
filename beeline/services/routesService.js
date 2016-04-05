import qs from 'querystring';

export function SearchService(userService) {
		return {
			data: {
				startName: '',
				endName: '',
				startLat: '',
				startLng: '',
				endLat: '',
				endLng: '',
				arrivalTime: '2016-02-26 01:00:00+00',
				startTime: new Date().getTime(),
				endTime: new Date().getTime() + 30*24*60*60*1000,
				lastresults: [],
				lastkickstart: [],
				isSubmitting: false
			},
			addReqData: function(sname, ename, slat, slng, elat, elng) {
				this.data.startName = sname;
				this.data.endName = ename;
				this.data.startLat = slat;
				this.data.startLng = slng;
				this.data.endLat = elat;
				this.data.endLng = elng;
			},
			getclosestroute: function() {
				//return Promise object
				return userService.beeline({
				method: 'GET',
				url: '/routes/search_by_latlon?' + qs.stringify({
						startLat: this.data.startLat,
						startLng: this.data.startLng,
						endLat: this.data.endLat,
						endLng: this.data.endLng,
						arrivalTime: this.data.arrivalTime,
						startTime:  this.data.startTime,
						endTime: this.data.endTime
					}),
			   })
			},
			setresults: function(searchresults){
				this.data.lastresults = searchresults;
			},
			setkickstart: function(searchkickstart){
				this.data.lastkickstart = searchkickstart;
			},
			setArrivalTime: function(arrtime) {
				arrtime = arrtime.split(':').map(x => parseInt(x))
				var arrivalTime = new (
					Date.bind.apply(Date, [{}, 2015, 1, 1].concat(arrtime)));

				this.data.arrivalTime = arrivalTime.toISOString();
			}
		};
	}

export function RoutesService($http, SERVER_URL) {

	return {

		getRoutes: function(){
			return $http.get(SERVER_URL + '/routes?include_trips=true')
			.then(function(response){
				return response.data;
			});
		},

		// data: {
		// 	routedata: {},
		// 	regiondata: [],
		// },
		// getallroutes: function() {
		// 	//return Promise object
		// 	return userService.beeline({
		// 		method: 'GET',
		// 		url: '/routes?include_trips=true',
		// 	})
		// },
		// setroutes: function(data) {
		// 	this.data.routedata = data;
		// },
		// setregions: function(data) {
		// 	this.data.regiondata = data;
		// },
		// getRecentRoutes: function(){
		// 	var bearer = userService.sessionToken;
		// 	if (!bearer){
		// 		return Promise.resolve([]);
		// 	}
		// 	else{
		// 		return userService.beeline({
		// 			method: 'GET',
		// 			url: '/routes/recent?limit=10'
		// 		})
		// 	}
		// }
	};
}