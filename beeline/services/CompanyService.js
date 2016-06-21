import assert from 'assert';

export default function CompanyService(UserService, $ionicModal, $rootScope) {
  var companyCache = {};
  var termsModal, termsScope;

  return {
    getCompany: function(id, ignoreCache) {
      assert(typeof id === 'number');
      if (companyCache[id] && !ignoreCache) return companyCache[id];
      return UserService.beeline({
        url: '/companies/' + id,
        method: 'GET',
      })
      .then(function(response) {
        companyCache[id] = response.data;
        return companyCache[id];
      });
    },
    getTerms: function(id) {
      assert.strictEqual(typeof id, 'number');

      return UserService.beeline({
        url: '/companies/' + id + '/html/terms',
        method: 'GET',
      })
      .then(function(response) {
        return response.data;
      });
    },
    showTerms: function (id) {
      if (!termsModal) {
        termsScope = $rootScope.$new();
        termsScope.termsModal = termsModal = $ionicModal.fromTemplate(
          require('../templates/termsModal.html'),
          {
            scope: termsScope
          }
        );
        var termsPromise = this.getTerms(id);

        termsPromise.then((terms) => {
          termsScope.company = {
            termsHTML: terms
          }
          termsModal.show();
        })
      }
      else {
        termsModal.show();
      }
    },
    getFeatures: function(id) {
      assert(typeof id === 'number');

      return UserService.beeline({
        url: '/companies/' + id + '/html/features',
        method: 'GET',
      })
      .then(function(response) {
        return response.data;
      });
    },
  };
}
