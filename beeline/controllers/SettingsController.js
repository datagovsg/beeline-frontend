import faqModalTemplate from '../templates/faq-modal.html';
import contactUsModalTemplate from '../templates/contact-us-modal.html';
import commonmark from 'commonmark';
import _ from 'lodash';

var reader = new commonmark.Parser({safe: true});
var writer = new commonmark.HtmlRenderer({safe: true});

export default [
  '$scope', 'UserService', 'StripeService', '$ionicModal', '$ionicPopup', 'Legalese', 'loadingSpinner', '$ionicLoading', '$state',
  function(
    $scope, UserService, StripeService, $ionicModal, $ionicPopup, Legalese, loadingSpinner, $ionicLoading, $state) {
    $scope.data = {};

    let isStripeLoading = false;

    // Track the login state of the user service
    $scope.$watch(function() {
      return UserService.getUser();
    }, function(newUser) {
      $scope.user = newUser;
    });

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
    }

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
    });

    $scope.hasPaymentInfo = function() {
      return _.get($scope.user, 'savedPaymentInfo.sources.data.length', 0) > 0;
    }

    $scope.removeCard = async function() {
      var response = await $ionicPopup.confirm({
        title: 'Are you sure you want to delete this payment method?',
      })

      if (!response) return;
      var user = $scope.user;
      try {
        var removeResult = await loadingSpinner(UserService.beeline({
          method: 'DELETE',
          url: `/users/${user.id}/creditCards/${user.savedPaymentInfo.sources.data[0].id}`,
        }));

        $scope.user.savedPaymentInfo = removeResult.data;

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

    $scope.addCard = async function() {

      if (isStripeLoading) return;

      try {
        isStripeLoading = true;
        const stripeToken = await StripeService.promptForToken(null, null, true);

        if (!stripeToken) return;

        const user = $scope.user;

        var result = await loadingSpinner(UserService.beeline({
          method: 'POST',
          url: `/users/${user.id}/creditCards`,
          data: {
            stripeToken: stripeToken.id
          },
        }));

        $scope.user.savedPaymentInfo = result.data;

      } catch (err) {
        console.log(err);
        throw new Error(`Error saving credit card details. ${_.get(err, 'data.message')}`)
      } finally {
        isStripeLoading = false;
        $scope.$digest();
      }
    }
  }];
