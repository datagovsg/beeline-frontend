import assert from 'assert';

export default function CompanyService(UserService) {
  var companyCache = {};
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
