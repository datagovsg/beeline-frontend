export default['$scope','$rootScope',function($scope, $rootScope) {
  $scope.options = {
    loop: false,
    effect: 'slide',
    speed: 500,
  };

  $scope.data = {
    slider: null,
    buttonLabel: 'SKIP',
    showHome: $rootScope.showHome || false
  }

  $scope.$on("$ionicSlides.sliderInitialized", function(event, data){
    //only has 1 slide
    if (data.slider.isBeginning && data.slider.isEnd) {
      $scope.data.buttonLabel = 'DONE'
    }
  });

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
