
export default ['CompanyService',
  function (CompanyService) {
    return {
      replace: true,
      template: '',
      scope: {
        'companyId': '<',
        'company': '=',
      },
      link: function (scope, element, attributes) {
        scope.$watch('companyId', function (companyId) {
          if (!companyId) {
            scope.company = {}
            return
          }

          let companyPromise = CompanyService.getCompany(+companyId)
          .then((company) => {
            scope.company = company
          })
        })
      },
    }
}]
