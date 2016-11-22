//this is found in kickstarter-detail, kickstarter-summary, kickstarter-recap, kickstarter-commit.
//information will show and hide accordingly
//passHide hides the pass in summary page
//extraHide hides the extra info about the kickstarter route in multiple pages
//preorderHide hides the info about "preordering" in recap and commit page


export default function () {
  return {
    template: require('./kickstartInfo.html'),
    restrict : 'E',
    replace: false,
    scope: {
      route: '<',
      passHide: '<?',
      extraHide: '<?',
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
