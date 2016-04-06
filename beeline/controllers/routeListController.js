import {formatHHMM_ampm} from '../shared/format';
import _ from 'lodash';

// Return an array of regions covered by a given array of routes
function getUniqueRegionsFromRoutes(routes){
  return _(routes).map(function(route){return route.regions;})
  .flatten()
  .uniqBy('id')
  .sortBy('name')
  .value();
};

// Returns a new array with routes matching the given regionId
// If regionId is undefined then returns a new array with all the same routes
function filterRoutesByRegionId(routes, regionId){
  return _.filter(routes, function(route) {
    if (regionId) return _.some(route.regions, {'id': regionId });
    else return true
  });
}

export default function ($scope, $state, Routes) {

  // New Hotness
  //////////////////////////////////////////////////////////////////////////////
  $scope.data = {} // Create a scope sub-object cos angular is dumb
                   // https://github.com/angular/angular.js/wiki/Understanding-Scopes

  Routes.getRoutes().then(function(routes){
    $scope.data.regions = getUniqueRegionsFromRoutes(routes);
    $scope.$watch('data.selectedRegionId', function(newSelectedRegionId, oldSelectedRegionId){
      $scope.data.activeRoutes = filterRoutesByRegionId(routes, +newSelectedRegionId);
      console.log($scope.data.activeRoutes);
    });
  });

 //  // Old Coldness
 //  //////////////////////////////////////////////////////////////////////////////
	// $scope.rlist = {
	// 	routesActive: [], //placeholders
	// 	routesKickstart: [],
	// 	allroutes: {},
	// 	allregions: [],
	// 	selectedRegion: null,
 //        recentlyBooked: []
	// }


	// //From the Routes data, make an array of Region Objects sorted by Name
	// //REFACTOR ME - current implementation is not ideal
	// $scope.makeRegionList = function(rdata) {

	// 	var regroute = [];
	// 	for(var i=0; i<rdata.length; i++)
	// 	{
	// 		for(var j=0; j<rdata[i].regions.length; j++)
	// 		{
	// 			var regid = rdata[i].regions[j].id;
	// 			var rname = rdata[i].regions[j].name;

	// 			if (typeof(regroute[regid]) == 'undefined') //doesn't exist yet
	// 			{
	// 				var temp = [];
	// 				temp.push(rdata[i].id);

	// 				regroute[regid] = {
	// 					id: regid,
	// 					name: rname,
	// 					routes: temp
	// 				};
	// 			}
	// 			else //exists already, append route id if it isn't already inside
	// 			{
	// 				if (regroute[regid].routes.indexOf(rdata[i].id) == -1)
	// 					regroute[regid].routes.push(rdata[i].id);
	// 			}
	// 		}
	// 	}

	// 	//at this point, regroute is an array of objects containing each region's data
	// 	//let's sort its contents by the region name

	// 	var rtemp = [];
	// 	regroute.forEach(function(elem){
	// 		if (rtemp.length == 0)
	// 			rtemp.push(elem);
	// 		else
	// 		{
	// 			// check if new elem's name comes before name of 1st elem in array
	// 			if (elem.name <= rtemp[0].name)
	// 			{
	// 				rtemp.unshift(elem); //prepend in front
	// 			}
	// 			else if (elem.name >= rtemp[rtemp.length-1].name)
	// 			{
	// 				rtemp.push(elem); //append to the end
	// 			}
	// 			else
	// 			{
	// 				//cycle through the array to find the right place to slot it
	// 				for(var k=0; k<(rtemp.length-1); k++)
	// 				{
	// 					if ((elem.name > rtemp[k].name)&&(elem.name < rtemp[k+1].name))
	// 					{
	// 						rtemp.splice((k+1), 0, elem);
	// 						break;
	// 					}
	// 				}
	// 			}
	// 		}
	// 	});

	// 	return rtemp;
	// }

	// //Create an object with the Routes corresponding to the Region that the user has selected
	// $scope.showRoutesList = function() {
	// 	var selectedRegion = $scope.rlist.selectedRegion;
	// 	var routesActive = [];
	// 	var routesKickstart = [];
	// 	var routesToShow = []; //placeholder
 //        var recentlyBooked = [];

	// 	//Get array of Route Ids to show
	// 	if ($scope.rlist.selectedRegion == null)
	// 	{
	// 		for (var robj in $scope.rlist.allroutes)
	// 		{
	// 			var temp = robj.split('_');
	// 			routesToShow.push(parseInt(temp[1]));
	// 		}
	// 	}
	// 	else
	// 		routesToShow = selectedRegion.routes; //array of route IDs

	// 	//Generate routedata to retrieve based on ID list
	// 	for(var i=0; i<routesToShow.length; i++)
	// 	{
	// 		var routeid;
	// 		if ($scope.rlist.selectedRegion == null) //initialise, show EVERYTHING
	// 			routeid = routesToShow[i];
	// 		else //user has selected a specific region from the filter list
	// 			routeid = selectedRegion.routes[i];

	// 		var	e = $scope.rlist.allroutes['route_'+routeid],
	// 			sd = new Date(e.trips[0].tripStops[0].time),
	// 			ed = new Date(e.trips[0].tripStops[e.trips[0].tripStops.length-1].time),
	// 			sroad = e.trips[0].tripStops[0].stop.description,
	// 			eroad = e.trips[0].tripStops[e.trips[0].tripStops.length-1].stop.description;

	// 		var rtemp = {
	// 			id: e.id,
	// 			busnum: 'ID ' + e.id,
	// 			stime:	formatHHMM_ampm(sd),
	// 			etime:	formatHHMM_ampm(ed),
	// 			sroad:	sroad,
	// 			eroad:	eroad,
	// 			active: 'Mon- Fri only'
	// 		};

	// 		routesActive.push(rtemp);
	// 	}

	// 	$scope.rlist.routesActive = routesActive;

 //        //recently booked
 //        Routes.getRecentRoutes().then(function(result){
 //            if (result.data){
 //                _(result.data).forEach(function(value){
 //                    var recentRoute = routesActive
 //                             .filter(route => route.id == value.id);
 //                    if (recentRoute.length == 1){
 //                        recentlyBooked.push(recentRoute[0]);
 //                    }
 //                });
 //                $scope.rlist.recentlyBooked = recentlyBooked;
 //            }
 //        });

	// 	/* Kickstart Test Data */
	// 	routesKickstart = [{
	// 		stime:	'7:15 am',
	// 		etime:	'7:50 am',
	// 		sstop:	'Opp The Treasury (Bus Stop ID 04249)',
	// 		estop:	'Serangoon Station (Bus Stop ID 66359)',
	// 		sroad:	'Punggol Ave 2',
	// 		eroad:	'Serangoon Nex',
	// 		dleft:	'5',
	// 		sdate:	'12 Mar',
	// 		pcurr:	'25%',
	// 		pneed:	'4',
	// 		price:	'7.50'
	// 	}];

	// 	$scope.rlist.routesKickstart = routesKickstart;
	// }
 //    $scope.$watch('rlist.selectedRegion', $scope.showRoutesList);

	// $scope.routeDetails = function(item) {
	// 	bookingService.routeId = item.id;
	// 	//console.log(item);

	// //FIX ME
	// 	//redirect to Routes Details
	// 	$state.go('tab.booking-pickup');
	// }

	// $scope.pendCommit = function(item) {
	// 	console.log('You clicked a kickstarter');
	// 	//console.log(item);

	// //FIX ME
	// 	//redirect to Routes Details
	// 	$state.go('tab.tickets');
	// }
};