

export default function companyTnc(CompanyService, $ionicModal, $q) {
  return {
    template: require('./companyTnc.html'),
    replace: false,
    scope: {
      companyId: '=',
    },
    link: function(scope, elem, attr) {
      scope.company = {};

      scope.$watch('companyId', function() {
        if (!scope.companyId) {
          scope.company = null;
          return;
        }

        var companyPromise = CompanyService.getCompany(scope.companyId)
        .then((company) => {
          scope.company = company;
        });

        var featuresPromise = CompanyService.getFeatures(scope.companyId)
        $q.all([featuresPromise, companyPromise])
        .then(([features, company]) => {
          company.featuresHTML = features;
        });
      });

      scope.showTerms = function() {
        if (!scope.company) return;

        if (!scope.termsModal) {
          scope.termsModal = $ionicModal.fromTemplate(
            require('./termsModal.html'),
            {
              scope: scope
            }
          );
          var termsPromise = CompanyService.getTerms(scope.company.id);

          termsPromise.then((terms) => {
            scope.company.termsHTML = terms;
            scope.termsModal.show();
          })
        }
        else {
          scope.termsModal.show();
        }
      };
    }
  };
}
