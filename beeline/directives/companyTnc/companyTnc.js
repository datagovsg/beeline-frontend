angular.module('beeline').directive('companyTnc', [
  'CompanyService',
  '$q',
  function companyTnc (CompanyService, $q) {
    return {
      template: require('./companyTnc.html'),
      replace: false,
      scope: {
        companyId: '=',
        features: '=',
        operatedHide: '<?',
        notesHide: '<?',
      },
      link: function (scope, elem, attr) {
        scope.company = {}

        scope.$watch('companyId', function () {
          if (!scope.companyId) {
            scope.company = null
            return
          }

          CompanyService.getCompany(scope.companyId).then(company => {
            scope.company = company
            scope.$emit('companyTnc.done')
            return company
          })
        })

        scope.showTerms = () => {
          if (!scope.company) return

          CompanyService.showTerms(scope.company.id)
        }
      },
    }
  },
])
