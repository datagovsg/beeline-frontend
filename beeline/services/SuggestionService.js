

export default function($http, UserService) {
  var suggestions = [];
  var selectedSuggestion = null;
  var similarSuggestions = [];

  return {
    get:function() {
            return UserService.beeline({
                method: 'GET',
                url: "/suggestions",
              });
          },
    getSuggestions: function() {
            return suggestions;
          },
    getSuggestionById: function(id) {
            for (var i = 0; i < suggestions.length; i++) {
                if (suggestions[i].id == id) {
                    console.log("found suggestion");
                    return suggestions[i];
                  }
              }
            return null;
          },
    getSimilar: function() {
            return UserService.beeline({
                method: 'GET',
                url: "/suggestions/10126/similar",
              })
                .then((response) => {
                  similarSuggestions = response.data;
                  return similarSuggestions;
                });
          },
    getSimilarSuggestions: function() {
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
                // need to handle if null
            return selectedSuggestion;
          }
  };
}
