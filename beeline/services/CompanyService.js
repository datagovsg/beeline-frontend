export default function CompanyService($http) {
        var company;
        return {
            Company: function(id){
                return $http.get("http://staging.beeline.sg/companies/"+id, {
                    headers: {
                    "Authorization": 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidXNlciIsInVzZXJJZCI6MSwiaWF0IjoxNDU2Mzk2MTU4fQ.eCgMcdrhZAWfWcQ3hhcYts9oyQetZ4prGGf4t5xEAwU'
                    }
            }).then(function(response){
                    company = response.data;
                });
            },

            getcompany: function(){
                return company;
            },

        };
    }