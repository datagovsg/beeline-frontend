angular.module("beeline").directive("liteRoute", function() {
  return {
    template: require("./liteRoute.html"),
    scope: {
      route: "<",
    },
  }
})
