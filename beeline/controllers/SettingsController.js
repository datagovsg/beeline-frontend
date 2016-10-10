import faqModalTemplate from '../templates/faq-modal.html';
import contactUsModalTemplate from '../templates/contact-us-modal.html';
import commonmark from 'commonmark';

var reader = new commonmark.Parser({safe: true});
var writer = new commonmark.HtmlRenderer({safe: true});

export default [
  '$scope', 'UserService', '$ionicModal', '$ionicPopup', 'Legalese', 'loadingSpinner', '$ionicLoading', '$state',
  function(
    $scope, UserService, $ionicModal, $ionicPopup, Legalese, loadingSpinner, $ionicLoading, $state) {
    $scope.data = {};

    // Track the login state of the user service
    $scope.$watch(function() {
      return UserService.getUser();
    }, function(newUser) {
      $scope.user = newUser;
      $scope.hasPaymentInfor = newUser.savedPaymentInfo && newUser.savedPaymentInfo.sources.data.length > 0;
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

    $scope.removeCard = async function() {
      var response = await $ionicPopup.confirm({
        title: 'Are you sure you want to remove this card?',
      })

      if (!response) return;
      var user = $scope.user;
      try {
        var removeResult = await loadingSpinner(UserService.beeline({
          method: 'DELETE',
          url: `/users/${user.id}/creditCards/${user.savedPaymentInfo.sources.data[0].id}`,
        }));

        if (removeResult) {
          //FIXME: old card infor flash and disapper after card is deleted
          $scope.hasPaymentInfor = false;
           $scope.$digest();
          await $ionicLoading.show({
            template: `
            <div>Removed!</div>
            `,
            duration: 1000,
          })
          $state.transitionTo("tabs.settings");
        }
      }
      catch(err) {
        console.log(err);
        await $ionicLoading.show({
          template: `
          <div> There was an error when remove the card. {{err && err.data && err.data.message}} Please try again later.</div>
          `,
          duration: 1000,
        })
      }
    };

  }];
