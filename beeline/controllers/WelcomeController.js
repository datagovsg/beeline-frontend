const queryString = require('querystring')

export default['$scope', '$state', '$stateParams', 'UserService', 'LoginDialog',
async function($scope, $state, $stateParams, UserService, LoginDialog) {
	console.log("StateParams",$stateParams)

	$scope.refCode = $stateParams.refCode || null;
	// $scope.refCode = $stateParams.refCode || throw Error("No referral code provided");

	if($scope.refCode){
		var query = queryString.stringify({code: $scope.refCode})

		var result = await UserService.beeline({
			method: 'GET',
			url: '/promotions/getRefCodeOwner?'+query,
		});

		$scope.refCodeOwner = result.data || null;
		// $scope.refCodeOwner = result.data || throw Error("Invalid referral code");
		
	} 
	// if refCode is null OR if refCodeOwner is null, throw error

	$scope.data = {}

	$scope.register = async function(){
		await UserService.registerViaReferralWelcome($scope.data.telephone, 
			$scope.refCode, $scope.refCodeOwner)

		$state.go('tabs.routes')
	}
	
}]







