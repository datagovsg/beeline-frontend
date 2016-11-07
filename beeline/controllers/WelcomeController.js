const queryString = require('querystring')

export default['$scope', '$stateParams', 'UserService',
async function($scope, $stateParams, UserService) {

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

}]
