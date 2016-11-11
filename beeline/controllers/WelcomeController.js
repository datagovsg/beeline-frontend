const queryString = require('querystring')

export default['$scope', '$state', '$stateParams', '$ionicPopup', 'UserService', 'LoginDialog', 
async function($scope, $state, $stateParams, $ionicPopup, UserService, LoginDialog) {
	// Verify if refCode is provided
	if($stateParams.refCode){
		$scope.refCode = $stateParams.refCode;
	} else {
		$ionicPopup.alert({
			title: "Invalid Link",
			subTitle: "You will now be sent back to the main page"
		}).then(() => $state.go('tabs.routes'))
	}

	// Check if the refCode is valid by retrieving user data to be displayed
	if($scope.refCode){
		var query = queryString.stringify({code: $scope.refCode})

		var refCodeOwner = await UserService.beeline({
			method: 'GET',
			url: '/promotions/refCodeOwner?'+query,
		});

		if(refCodeOwner.data){
			$scope.refCodeOwner = refCodeOwner.data	
		} else {
			$ionicPopup.alert({
				title: "Invalid Referral Code",
				subTitle: "You will now be sent back to the main page"
			}).then(() => $state.go('tabs.routes'))
		}
		
	} 
	// if refCode is null OR if refCodeOwner is null, throw error

	$scope.data = {}

	$scope.register = async function(){
		await UserService.registerViaReferralWelcome($scope.data.telephone, 
			$scope.refCode, $scope.refCodeOwner)

		$state.go('tabs.routes')
	}
	
}]







