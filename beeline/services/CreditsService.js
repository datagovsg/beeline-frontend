angular.module("beeline").factory("CreditsService", [
  "UserService", "RequestService",
  function CreditsService(UserService, RequestService) {
    // General credits
    let userCreditsCache
    let userCredits

    // Referral credits
    let referralCreditsCache
    let referralCredits

    UserService.userEvents.on("userChanged", () => {
      instance.fetchUserCredits(true)
      instance.fetchReferralCredits(true)
    })

    const instance = {
      getUserCredits: function() {
        return userCredits
      },

      // get general credits associated with user
      // input:
      // - ignoreCache - boolean
      // output:
      // - Promise containing amount of general credits associated with user
      fetchUserCredits: function(ignoreCache) {
        if (!ignoreCache && userCreditsCache) {
          return userCreditsCache
        }

        let user = UserService.getUser()

        if (!user) {
          return (userCreditsCache = Promise.resolve((userCredits = null)))
        } else {
          return (userCreditsCache = RequestService.beeline({
            method: "GET",
            url: "/credits",
          }).then(response => {
            return (userCredits = response.data)
          }))
        }
      },

      getReferralCredits: function() {
        return referralCredits
      },

      // get referral credits associated with user
      // input:
      // - ignoreCache - boolean
      // output:
      // - Promise containing amount of referral credits associated with user
      fetchReferralCredits: function(ignoreCache) {
        if (!ignoreCache && referralCreditsCache) {
          return referralCreditsCache
        }

        let user = UserService.getUser()

        if (!user) {
          return (referralCreditsCache = Promise.resolve(
            (referralCredits = null)
          ))
        } else {
          return (referralCreditsCache = RequestService.beeline({
            method: "GET",
            url: "/user/referralCredits",
          }).then(response => {
            return (referralCredits = response.data)
          }))
        }
      },
    }

    return instance
  },
])
