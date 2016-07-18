export default['$scope',function($scope) {
  $scope.options = {
    loop: false,
    effect: 'slide',
    speed: 500,
  };

  $scope.data = {
    slider: null,
    button: 'SKIP'
  }

  $scope.$on("$ionicSlides.slideChangeEnd", function(event, data){
    // note: the indexes are 0-based
    $scope.activeIndex = data.slider.activeIndex;
    if ($scope.activeIndex !== 2) {
      $scope.data.button = 'SKIP'
    }
    if ($scope.activeIndex === 2) {
      $scope.data.button = 'DONE'
    }
    $scope.$digest();
  });
}]
