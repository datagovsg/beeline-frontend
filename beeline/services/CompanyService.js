import assert from 'assert';
import commonmark from 'commonmark';

var reader = new commonmark.Parser({safe: true});
var writer = new commonmark.HtmlRenderer({safe: true});

export default function CompanyService(UserService, $ionicModal, $rootScope, $q) {
  var companyCache = {};
  var termsModal, termsScope;

  return {
    getCompany: function(id, ignoreCache) {
      assert(typeof id === 'number');
      if (companyCache[id] && !ignoreCache) return $q.resolve(companyCache[id]);
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
      }

      this.getCompany(id)
      .then((company) => {
        termsScope.company = {
          termsHTML: writer.render(reader.parse(company.terms))
        };
        termsModal.show();
      })
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
