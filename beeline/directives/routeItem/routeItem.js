import routeItemTemplate from './routeItem.html';

export default function($state, BookingService, CompanyService) {
  return {
    replace: false,
    template: routeItemTemplate,
    scope: {
      route: '=',
    },
    link: function(scope, element, attributes) {

      scope.$watch('route', function() {
        if (!scope.route.transportCompanyId) {
          scope.companyName = '';
          return;
        }

        var companyPromise = CompanyService.getCompany(scope.route.transportCompanyId)
        .then((company) => {
          scope.companyName = company.name;
          return scope.companyName;
        });
      });
    },
  };
}
