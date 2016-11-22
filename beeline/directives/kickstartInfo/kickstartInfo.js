export default function () {
  return {
    template: require('./kickstartInfo.html'),
    restrict : 'E',
    replace: false,
    scope: {
      route: '<',
      passHide: '<?',
    },
    link: function(scope, elem, attr) {
      scope.$watchCollection("route.trips",(trips)=>{
        if(trips) {
          var startDate = new Date(trips[0].date);
          scope.validTill = new Date(startDate.getFullYear(), startDate.getMonth()+1, startDate.getDate());
        }
      })
    }
  };
}
