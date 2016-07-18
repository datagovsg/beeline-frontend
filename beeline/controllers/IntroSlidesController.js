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
    if (!data.slider.isEnd) {
      $scope.data.buttonLabel = 'SKIP'
    }
    else {
      $scope.data.buttonLabel = 'DONE'
    }
    $scope.$digest();
  });
}]
