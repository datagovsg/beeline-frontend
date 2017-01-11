import faqModalTemplate from '../templates/faq-modal.html';
import contactUsModalTemplate from '../templates/contact-us-modal.html';
import shareReferralModalTemplate from '../templates/share-referral-modal.html';
import commonmark from 'commonmark';
import _ from 'lodash';


var reader = new commonmark.Parser({safe: true});
var writer = new commonmark.HtmlRenderer({safe: true});

export default [
  '$scope', 'UserService', 'StripeService', 'KickstarterService',
  '$ionicModal', '$ionicPopup', 'Legalese', 'loadingSpinner', '$ionicLoading',
  '$state','$cordovaSocialSharing',
  function(
    $scope, UserService, StripeService, KickstarterService,
    $ionicModal, $ionicPopup, Legalese, loadingSpinner, $ionicLoading,
    $state, $cordovaSocialSharing) {

    $scope.data = {};
    $scope.hasCordova = !!window.cordova || false
    $scope.isOnKickstarter = false;

    let isPressed = false;

    // Track the login state of the user service
    $scope.$watch(function() {
      return UserService.getUser();
    }, function(newUser) {
      $scope.user = newUser;
    });

    // Function that allows user to share an invitation with a referral code to other apps on the phone
    $scope.cordovaShare = async function(){
      var url = $scope.referralSharing.invitation_msg_url + $scope.user.referralCode.code
      var msg = $scope.referralSharing.invitation_msg
      $cordovaSocialSharing.share(msg, $scope.referralSharing.title, null, url)
        .then(function(result){
          // console.log("Success")
        }, function(err){
          // console.log("Error")
        })

    }

    // templates for sharing of referrals
    $scope.referralSharing = {
      title: "Try out Beeline!",
      instructions_msg: "Share this to your friend so that they receive $10 off Beeline rides.  You'll automatically get $10 ride credits, once they claim their first ride too.",
      invitation_msg: "Here is FREE $10 credits for you to try out Beeline rides, a marketplace for crowdsourced bus services. Visit "  ,
      invitation_msg_url: "https://app.beeline.sg/#/welcome?refCode=",
    }

    // Map in the login items
    $scope.logIn = UserService.promptLogIn;
    $scope.logOut = UserService.promptLogOut;

    // Generic event handler to allow user to update their
    // name, email
    // FIXME: Get Yixin to review the user info update flow.
    $scope.updateUserInfo = function(field){
      return UserService.promptUpdateUserInfo(field);
    }

    // Update telephone is distinct from the update user due to verification
    $scope.updateTelephone = UserService.promptUpdatePhone;

    // Configure modals

    // Load the pages only when requested.
    function assetScope(assetName) {
      var newScope = $scope.$new();
      newScope.error = newScope.html = null;
      newScope.$on('modal.shown', () => {
        UserService.beeline({
          method: 'GET',
          url: `/assets/${assetName}`
        })
        .then((response) => {
          newScope.html = writer.render(reader.parse(response.data.data));
          newScope.error = false;
        })
        .catch((error) => {
          console.log(error)
          newScope.html = "";
          newScope.error = error;
        })
      })
      return newScope;
    };

    $scope.shareReferralModal = $ionicModal.fromTemplate(
      shareReferralModalTemplate,
      {scope: $scope}

    );
    $scope.faqModal = $ionicModal.fromTemplate(
      faqModalTemplate,
      {scope: assetScope('FAQ')}
    );
    $scope.showPrivacyPolicy = () => Legalese.showPrivacyPolicy();
    $scope.showTermsOfUse = () => Legalese.showTermsOfUse();
    $scope.contactUsModal = $ionicModal.fromTemplate(
      contactUsModalTemplate,
      {scope: $scope}
    );
    $scope.$on('$destroy', function() {
      $scope.faqModal.destroy();
      $scope.contactUsModal.destroy();
      $scope.shareReferralModal.destroy();
    });

    $scope.hasPaymentInfo = function() {
      return _.get($scope.user, 'savedPaymentInfo.sources.data.length', 0) > 0;
    };

    $scope.promptChangeOrRemoveCard = async function() {

      if (isPressed) return;

      try {
        isPressed = true;
        $scope.isOnKickstarter = await checkIfOnKickstarter();
      } catch (err) {
        console.log(err);
        await $ionicLoading.show({
          template: `
          <div> Network error. ${err && err.data && err.data.message} Please try again later.</div>
          `,
          duration: 3500,
        })
        return;
      } finally {
        isPressed = false;
      }

      $scope.cardDetailPopup = $ionicPopup.show({
        title: 'Payment Method',
        scope: $scope,
        template: `
          <div class="item item-text-wrap text-center">
            <div>
              <b>{{user.savedPaymentInfo.sources.data[0].brand}}</b> ending in <b> {{user.savedPaymentInfo.sources.data[0].last4}} </b>
            </div>
            <div>
              <button class="button button-outline button-royal small-button"
                ng-click="changeCard()">
                Change
              </button>
            </div>
          </div>
          <div class="item item-text-wrap text-center" ng-if="isOnKickstarter">
            You cannot remove this card unless the Crowdstart route you back expires.
          </div>
        `,
        buttons: [
          {  text: 'Cancel' },
          {
            text: 'Remove',
            type: ($scope.isOnKickstarter ? 'button-disabled' : 'button-positive'),
            onTap: function(e) {
              if ($scope.isOnKickstarter) {
                e.preventDefault();
              }
              else {
                removeCard();
              }
            }
          }
        ]
      });
    };

    var removeCard = async function() {
      var response = await $ionicPopup.confirm({
        title: 'Remove Payment Method',
        scope: $scope,
        template: `
        <div class="item item-text-wrap text-center">
            Are you sure you want to delete this payment method?
        </div>
        <div class="item item-text-wrap text-center">
            <b>{{user.savedPaymentInfo.sources.data[0].brand}}</b> ending in <b> {{user.savedPaymentInfo.sources.data[0].last4}} </b>
        </div>
        `
      })

      if (!response) return;

      try {
        await loadingSpinner(UserService.removePaymentInfo());

        await $ionicLoading.show({
          template: `
          <div>Payment method has been deleted!</div>
          `,
          duration: 1500,
        })
      }
      catch(err) {
        console.log(err);
        await $ionicLoading.show({
          template: `
          <div> Failed to delete payment method. ${err && err.data && err.data.message} Please try again later.</div>
          `,
          duration: 3500,
        })
      } finally {
        $scope.$digest();
      }
    };

    async function checkIfOnKickstarter() {
      let response = await KickstarterService.hasBids();
      return response;
    };

    $scope.addCard = async function() {

      if (isPressed) return;

      try {
        isPressed = true;
        const stripeToken = await StripeService.promptForToken(null, null, true);

        if (!stripeToken) return;

        await loadingSpinner(
          UserService.savePaymentInfo(stripeToken.id)
        );

      } catch (err) {
        console.log(err);
        throw new Error(`Error saving credit card details. ${_.get(err, 'data.message')}`)
      } finally {
        isPressed = false;
        $scope.$digest();
      }
    };

    $scope.changeCard = async function() {

      if (isPressed) return;

      try {
        isPressed = true;
        $scope.cardDetailPopup.close();
        const stripeToken = await StripeService.promptForToken(null, null, true);

        if (!stripeToken) return;

        await loadingSpinner(
          UserService.updatePaymentInfo(stripeToken.id)
        );

      } catch (err) {
        console.log(err);
        throw new Error(`Error saving credit card details. ${_.get(err, 'data.message')}`)
      } finally {
        isPressed = false;
        $scope.$digest();
      }
    };

}];
