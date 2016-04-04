

export default function init(app) {
    app.factory('suggestionService', function($http) {
        var suggestions = [];
        var selectedSuggestion = null;
        var similarSuggestions = [];

        return {
            get:function(){
                return $http.get("http://staging.beeline.sg/suggestions", {
                        headers: {
                        "Authorization": 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidXNlciIsInVzZXJJZCI6MjAwLCJpYXQiOjE0NTg3OTAzMzB9.tX1zJofUeHTqCRoJ8hI1Fk36n7K9ftXMk0QkjiyPPBc'
                        }
                })
            },
            getSuggestions: function(){
                return suggestions;
            },
            getSuggestionById: function(id){
                for(var i=0;i<suggestions.length;i++){
                    if(suggestions[i].id == id){
                        console.log("found suggestion");
                        return suggestions[i];
                    }
                }
                return null;
            },
            getSimilar: function(){
                return $http.get("http://staging.beeline.sg/suggestions/10126/similar", {
                    headers: {
                    "Authorization": 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoidXNlciIsInVzZXJJZCI6MjAwLCJpYXQiOjE0NTg3OTAzMzB9.tX1zJofUeHTqCRoJ8hI1Fk36n7K9ftXMk0QkjiyPPBc'
                    }
                }).then((response) => {
                    similarSuggestions = response.data;
                    return similarSuggestions;
                });
            },
            getSimilarSuggestions: function(){
                return [];
            },

            setSelectedSuggestion: function(suggestionId) {
              console.log("setselectedsuggestion");
              console.log(suggestionId);
             for (var i = 0; i < suggestions.length; i++) {
                if (suggestions[i].id === suggestionId) {
                  selectedSuggestion = suggestions[i];

                }
              }
              console.log("-------------------");
              console.log("setselectedticket");
              console.log(selectedSuggestion);
            },
            getSelectedSuggestion: function() {
                //need to handle if null
                return selectedSuggestion;
            }
        };
    })
}
