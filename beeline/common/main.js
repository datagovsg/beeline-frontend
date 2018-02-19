let common = angular.module("common", [])

require("./RequestService")
require("./LoadingSpinner")
require("./GoogleAnalytics")
require("./OneMapPlaceService")
require("./MapViewFactory")
require("./RotatedImageService")
require("./ServerTimeService")
require("./SharedVariableService")
require("./MapService")

module.exports = common
