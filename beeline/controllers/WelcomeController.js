const queryString = require('querystring')

export default['$scope', '$state', '$stateParams', '$ionicPopup', '$ionicLoading', 'UserService', 'LoginDialog', 
async function($scope, $state, $stateParams, $ionicPopup, $ionicLoading, UserService, LoginDialog) {
	$scope.$on('$ionicView.beforeEnter', async function(){
		// Verify if refCode is provided
		$scope.isLoaded = false;
		$scope.isValidReferral = false;
		$ionicLoading.show()

		if($stateParams.refCode){
			$scope.refCode = $stateParams.refCode;
			$scope.isValidReferral = true;
		} else {
			$scope.isValidReferral = false;
		}

		if($scope.isValidReferral){
			var query = queryString.stringify({code: $scope.refCode})
			
			try {
				var refCodeOwner = await UserService.beeline({
					method: 'GET',
					url: '/promotions/refCodeOwner?'+query,
				});

				if(refCodeOwner.data){
					$scope.refCodeOwner = refCodeOwner.data	
				} else {
					$scope.isValidReferral = false;
				}

			} catch (error){
				$ionicPopup.alert({
					title: error.data.message,
					subTitle: error.statusText
				});

				$scope.isValidReferral = false
			}
		} 

		$ionicLoading.hide();
		$scope.isLoaded = true;
	});

	$scope.data = {}

	$scope.register = async function(){
		await UserService.registerViaReferralWelcome($scope.data.telephone, 
			$scope.refCode, $scope.refCodeOwner)

		$state.go('tabs.routes')
	}
	
}]







