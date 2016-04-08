export default function CompanyService(UserService) {
    var company;
    return {
        Company: function(id){
            return $http.get("http://staging.beeline.sg/companies/"+id, {
                headers: {
                "Authorization": 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidXNlciIsInVzZXJJZCI6MSwiaWF0IjoxNDU2Mzk2MTU4fQ.eCgMcdrhZAWfWcQ3hhcYts9oyQetZ4prGGf4t5xEAwU'
                }
        }).then(function(response){
                return company = response.data;
            });
        },

        getCompany(id){
          return UserService.beeline({
            url: `/companies/${id}`,
            method: 'GET',
          })
          .then(function(response){
            return response.data;
          });
        },

        getcompany: function(){
            return company;
        },
    };
  }
