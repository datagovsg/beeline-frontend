import faqModalTemplate from "../templates/faq-modal.html"
import contactUsModalTemplate from "../templates/contact-us-modal.html"
import shareReferralModalTemplate from "../templates/share-referral-modal.html"
import commonmark from "commonmark"
import _ from "lodash"

const reader = new commonmark.Parser({ safe: true })
const writer = new commonmark.HtmlRenderer({ safe: true })

export default [
  "$scope",
  "UserService",
  "StripeService",
  "KickstarterService",
  "$ionicModal",
  "$ionicPopup",
  "$window",
  "Legalese",
  "loadingSpinner",
  "$ionicLoading",
  "$cordovaSocialSharing",
  "replace",
  "DevicePromise",
  function(
    $scope,
    UserService,
    StripeService,
    KickstarterService,
    $ionicModal,
    $ionicPopup,
    $window,
    Legalese,
    loadingSpinner,
    $ionicLoading,
    $cordovaSocialSharing,
    replace,
    DevicePromise
  ) {
    $scope.data = {}
    $scope.hasCordova = Boolean($window.cordova) || false
    $scope.isOnKickstarter = false

    DevicePromise.then(() => {
      if ($scope.hasCordova) {
        chcp.getVersionInfo((error, data) => {
          $scope.data.currentVersion = data.currentWebVersion || null
        })
      }
    })

    let isPressed = false

    // Track the login state of the user service
    $scope.$watch(
      function() {
        return UserService.getUser()
      },
      function(newUser) {
        $scope.user = newUser

        if (newUser) {
          $scope.shareMsg = UserService.getReferralMsg()
        } else {
          $scope.shareMsg = null
        }
      }
    )

    // Function that allows user to share an invitation with a referral code to
    // other apps on the phone
    $scope.cordovaShare = async function() {
      $cordovaSocialSharing.share($scope.shareMsg, "Try out Beeline!")
    }

    // Map in the login items
    $scope.logIn = UserService.promptLogIn
    $scope.logOut = UserService.promptLogOut

    // Generic event handler to allow user to update their
    // name, email
    // FIXME: Get Yixin to review the user info update flow.
    $scope.updateUserInfo = function(field) {
      return UserService.promptUpdateUserInfo(field)
    }

    $scope.verifyEmail = function () {
      const alertScope = $scope.$new()

      return UserService.sendEmailVerification()
      .then(() => {
        return $ionicPopup.alert({
          title: 'Email Verification Sent',
          template: `We have sent an email verification to {{user.email}}.
          Please check your inbox for further instructions`,
          scope: $scope,
        })
      })
      .catch((err) => {
        _.assign(alertScope, {message: _.get(err, 'data.message')})

        return $ionicPopup.alert({
          title: 'Email Verification Failed',
          template: `There was a problem sending the email verification: {{message}}`,
          scope: alertScope,
        })
      })
      .finally(() => {
        alertScope.$destroy()
      })
    }

    // Update telephone is distinct from the update user due to verification
    $scope.updateTelephone = UserService.promptUpdatePhone

    // Configure modals

    // Load the pages only when requested.
    function assetScope(assetName) {
      const newScope = $scope.$new()
      newScope.error = newScope.html = null
      newScope.$on("modal.shown", () => {
        UserService.beeline({
          method: "GET",
          url: replace(`/assets/${assetName}`),
        })
          .then(response => {
            newScope.html = writer.render(reader.parse(response.data.data))
            newScope.error = false
          })
          .catch(error => {
            console.error(error)
            newScope.html = ""
            newScope.error = error
          })
      })
      return newScope
    }

    $scope.shareReferralModal = $ionicModal.fromTemplate(
      shareReferralModalTemplate,
      { scope: $scope }
    )

    $scope.faqModal = $ionicModal.fromTemplate(faqModalTemplate, {
      scope: assetScope("FAQ"),
    })
    $scope.showPrivacyPolicy = () => Legalese.showPrivacyPolicy()
    $scope.showTermsOfUse = () => Legalese.showTermsOfUse()
    $scope.contactUsModal = $ionicModal.fromTemplate(contactUsModalTemplate, {
      scope: $scope,
    })
    $scope.$on("$destroy", function() {
      $scope.faqModal.destroy()
      $scope.contactUsModal.destroy()
      $scope.shareReferralModal.destroy()
    })

    $scope.hasPaymentInfo = function() {
      return _.get($scope.user, "savedPaymentInfo.sources.data.length", 0) > 0
    }

    $scope.promptChangeOrRemoveCard = async function() {
      if (isPressed) return

      try {
        isPressed = true
        $scope.isOnKickstarter = await checkIfOnKickstarter()
      } catch (err) {
        console.error(err)
        await $ionicLoading.show({
          template: `
          <div> Network error. ${err && err.data && err.data.message} Please \
          try again later.</div>
          `,
          duration: 3500,
        })
        return
      } finally {
        isPressed = false
      }

      $scope.cardDetailPopup = $ionicPopup.show({
        title: "Payment Method",
        scope: $scope,
        template: `
          <div class="item item-text-wrap text-center">
            <div>
              <b>{{user.savedPaymentInfo.sources.data[0].brand}}</b> ending in \
              <b> {{user.savedPaymentInfo.sources.data[0].last4}} </b>
            </div>
            <div>
              <button class="button button-outline button-royal small-button"
                ng-click="changeCard()">
                Change
              </button>
            </div>
          </div>
          <div class="item item-text-wrap text-center" ng-if="isOnKickstarter">
            You cannot remove this card unless the Crowdstart route you back \
            expires.
          </div>
        `,
        buttons: [
          { text: "Cancel" },
          {
            text: "Remove",
            type: $scope.isOnKickstarter
              ? "button-disabled"
              : "button-positive",
            onTap: function(e) {
              if ($scope.isOnKickstarter) {
                e.preventDefault()
              } else {
                removeCard()
              }
            },
          },
        ],
      })
    }

    async function removeCard() {
      const response = await $ionicPopup.confirm({
        title: "Remove Payment Method",
        scope: $scope,
        template: `
        <div class="item item-text-wrap text-center">
            Are you sure you want to delete this payment method?
        </div>
        <div class="item item-text-wrap text-center">
            <b>{{user.savedPaymentInfo.sources.data[0].brand}}</b> ending in \
            <b> {{user.savedPaymentInfo.sources.data[0].last4}} </b>
        </div>
        `,
      })

      if (!response) return

      try {
        await loadingSpinner(UserService.removePaymentInfo())

        await $ionicLoading.show({
          template: `
          <div>Payment method has been deleted!</div>
          `,
          duration: 1500,
        })
      } catch (err) {
        console.error(err)
        await $ionicLoading.show({
          template: `
          <div> Failed to delete payment method. \
          ${err && err.data && err.data.message} Please try again later.</div>
          `,
          duration: 3500,
        })
      } finally {
        $scope.$digest()
      }
    }

    async function checkIfOnKickstarter() {
      let response = await KickstarterService.hasBids()
      return response
    }

    $scope.addCard = async function() {
      if (isPressed) return

      try {
        isPressed = true
        const stripeToken = await StripeService.promptForToken(null, null, true)

        if (!stripeToken) return

        await loadingSpinner(UserService.savePaymentInfo(stripeToken.id))
      } catch (err) {
        console.error(err)
        throw new Error(
          `Error saving credit card details. ${_.get(err, "data.message")}`
        )
      } finally {
        isPressed = false
        $scope.$digest()
      }
    }

    $scope.changeCard = async function() {
      if (isPressed) return

      try {
        isPressed = true
        $scope.cardDetailPopup.close()
        const stripeToken = await StripeService.promptForToken(null, null, true)

        if (!stripeToken) return

        await loadingSpinner(UserService.updatePaymentInfo(stripeToken.id))
      } catch (err) {
        console.error(err)
        throw new Error(
          `Error saving credit card details. ${_.get(err, "data.message")}`
        )
      } finally {
        isPressed = false
        $scope.$digest()
      }
    }
  },
]
