// this is found in kickstarter-detail, kickstarter-summary
// information will show and hide accordingly
// passHide hides the pass in summary page
// preorderHide hides the info about asking user to "preorder", takes effect in recap page

angular.module("beeline").directive("crowdstartInfo", function() {
  return {
    template: require("./crowdstartInfo.html"),
    restrict: "E",
    replace: false,
    scope: {
      route: "<",
      passHide: "<?",
      preorderHide: "<?",
      contentHide: "<?",
    },
  }
})
