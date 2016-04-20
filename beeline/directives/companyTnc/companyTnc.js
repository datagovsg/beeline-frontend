

export default function companyTnc(CompanyService, $ionicModal) {
  return {
    template: require('./companyTnc.html'),
    replace: false,
    scope: {
      companyId: '=',
    },
    link: function (scope, elem, attr) {
      scope.company = {};

      scope.$watch('companyId', function() {
        if (!scope.companyId) {
          scope.company = {};
          return;
        }
        CompanyService.getCompany(scope.companyId)
        .then((company) => {
          scope.company = company;
          company.featuresParsed = JSON.parse(company.features)
          company.termsParsed = JSON.parse(company.terms)
          company.termsHTML = company.termsParsed.map(t => t.txt).join('\n')
        })
      })

      scope.showTerms = function() {
        if (!scope.termsModal) {
          scope.termsModal = $ionicModal.fromTemplate(
            require('./termsModal.html'),
            {
              scope: scope
            }
          )
        }
        scope.termsModal.show();
      }
    }
  }
}
