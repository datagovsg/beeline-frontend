export function CompanyService(UserService) {
  var companyCache = {};
  return {
    getCompany: function(id, ignoreCache) {
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
  };
}
