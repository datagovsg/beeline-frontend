import assert from 'assert';
import commonmark from 'commonmark';

var reader = new commonmark.Parser({safe: true});
var writer = new commonmark.HtmlRenderer({safe: true});

export default function CompanyService(UserService, $ionicModal, $rootScope, $q) {
  var companyCache = {};
  var termsScope;

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
    showTerms: function (id) {

      termsScope = $rootScope.$new();
      termsScope.termsModal = $ionicModal.fromTemplate(
        require('../templates/termsModal.html'),
        {
          scope: termsScope
        }
      );

      this.getCompany(id)
      .then((company) => {
        termsScope.company = {
          termsHTML: writer.render(reader.parse(company.terms))
        };
        termsScope.termsModal.show();
      })

      return new Promise((resolve, reject) => {
        termsScope.$on('modal.hidden', () => {
          termsScope.$destroy()
          resolve();
        })
      })
    },
  };
}
