// this is found in kickstarter-detail, kickstarter-summary, kickstarter-recap.
// information will show and hide accordingly
// passHide hides the pass in summary page
// preorderHide hides the info about asking user to "preorder", takes effect in recap page


export default function () {
  return {
    template: require('./kickstartInfo.html'),
    restrict : 'E',
    replace: false,
    scope: {
      route: '<',
      passHide: '<?',
      preorderHide: '<?',
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
