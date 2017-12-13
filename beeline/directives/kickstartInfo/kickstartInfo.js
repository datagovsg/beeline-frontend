// this is found in kickstarter-detail, kickstarter-summary, kickstarter-recap.
// information will show and hide accordingly
// passHide hides the pass in summary page
// preorderHide hides the info about asking user to "preorder", takes effect in recap page

angular.module("beeline").directive("kickstartInfo", function() {
  return {
    template: require("./kickstartInfo.html"),
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
