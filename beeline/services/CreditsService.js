import _ from 'lodash';
import assert from 'assert';

export default function CreditsService($http, UserService, $q) {
	// General credits
	var userCreditsCache
	var userCredits

	// Referral credits
	var referralCreditsCache
	var referralCredits

	UserService.userEvents.on('userChanged', () => {
		instance.fetchUserCredits(true)
		instance.fetchReferralCredits(true)
	})

	var instance = {
		getUserCredits: function(){
			return userCredits
		},

		// get general credits associated with user
		// input:
		// - ignoreCache - boolean
		// output: 
		// - Promise containing amount of general credits associated with user
		fetchUserCredits: function(ignoreCache){
			if(!ignoreCache && userCreditsCache) {
				return userCreditsCache
			}

			let user = UserService.getUser()

			if(!user){
				return userCreditsCache = Promise.resolve(
					userCredits = null
				)
			} else {
				return userCreditsCache = UserService.beeline({
					method: 'GET',
					url: '/credits'
				}).then((response) => {
					return userCredits = response.data
				})
			}
		},

		getReferralCredits: function(){
			return referralCredits
		},

		// get referral credits associated with user
		// input:
		// - ignoreCache - boolean
		// output: 
		// - Promise containing amount of referral credits associated with user
		fetchReferralCredits: function(ignoreCache){
			if(!ignoreCache && referralCreditsCache) {
				return referralCreditsCache
			}

			let user = UserService.getUser()

			if(!user){
				return referralCreditsCache = Promise.resolve(
					referralCredits = null
				)
			} else {
				return referralCreditsCache = UserService.beeline({
					method: 'GET',
					url: '/user/referralCredits'
				}).then((response) => {
					return referralCredits = response.data
				})
			}
		},

	}

	return instance
}