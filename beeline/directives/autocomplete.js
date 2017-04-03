export default function(uiGmapGoogleMapApi) {
  return {
    scope: true,
    link(scope, element, attribute) {
      uiGmapGoogleMapApi.then((googleMaps) => {

        // Initialize it with google autocomplete
        scope.autocomplete = new googleMaps.places.Autocomplete(element[0], {
          componentRestrictions: {country: 'SG'}
        });
        scope.autocompleteService = new googleMaps.places.AutocompleteService();
        scope.placesService = new google.maps.places.PlacesService(element[0]);

        // Bind the place change property as a listener
        // If a proper autocomplete option is selected then just callback
        // Otherwise make a best effort attempt to find one with the free text
        scope.autocomplete.addListener('place_changed', () => {
          let place = scope.autocomplete.getPlace();
          // Augment the object with the autocomplete string
          place.description = element[0].value;
          // If a proper autocomplete option is selected then just callback
          if (place.geometry) {
            scope.$apply(() => {
              scope.$eval(attribute['placeChanged'], { '$event': place });
            });
          }
          // If free text is entered then try to complete it
          // "free text" is an object with just a name attribute specified
          // this is according to the google autocomplete spec
          else {
            // Start by manually calling the autocomplete service
            scope.autocompleteService.getPlacePredictions({
              componentRestrictions: {country: 'SG'},
              input: place.name
            }, (predictions) => {
              // If no results found then just shortcircuit with the empty place
              if (!predictions || predictions.length === 0) {
                scope.$apply(() => {
                  scope.$eval(attribute['placeChanged'], { '$event': place });
                });
                return;
              }
              // Grab the top prediction and get the details
              // Apply the details as the full result
              scope.placesService.getDetails({
                placeId: predictions[0].place_id
              }, result => {
                // If we fail getting the details then shortcircuit
                if (!result) {
                  scope.$apply(() => {
                    scope.$eval(attribute['placeChanged'], { '$event': place });
                  });
                  return;
                }
                // Otherwise return the fully formed place
                place = result;
                // Augment the object with the prediction string
                place.description = predictions[0].description;
                // Return the found place
                scope.$apply(() => {
                  scope.$eval(attribute['placeChanged'], { '$event': place });
                });
              });
            });
          }
        });

        // Blur on enter
        element[0].addEventListener("keypress", function(event) {
          if (event.key === "Enter") this.blur();
        });

        // element[0].addEventListener("blur", function(event) {
        //   console.log("hello");

        // });

        // Hack to get ionic fast tap working nicely with google maps
        // see http://ionicframework.com/docs/v1/api/page/tap/
        element[0].addEventListener("focus", function(event) {
          const pacContainers = document.querySelectorAll('.pac-container');
          for (let pac of pacContainers) { pac.dataset.tapDisabled = true; }
        });

      });
    }
  }
}
