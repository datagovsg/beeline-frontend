export default['$scope',function($scope) {
  $scope.options = {
    loop: false,
    effect: 'slide',
    speed: 500,
  };

  $scope.data = {
    slider: null,
    buttonLabel: 'SKIP'
  }

  $scope.$on("$ionicSlides.slideChangeEnd", function(event, data){
    // note: the indexes are 0-based
    $scope.activeIndex = data.slider.activeIndex;
    if ($scope.activeIndex !== 2) {
      $scope.data.buttonLabel = 'SKIP'
    }
    if ($scope.activeIndex === 2) {
      $scope.data.buttonLabel = 'DONE'
    }
    $scope.$digest();
  });
}]
