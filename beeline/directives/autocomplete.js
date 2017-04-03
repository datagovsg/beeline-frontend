
export default function(uiGmapGoogleMapApi) {
  return {
    scope: true,
    link(scope, element, attribute) {
      uiGmapGoogleMapApi.then((googleMaps) => {

        // Initialize it with google autocomplete
        scope.$autocomplete = new googleMaps.places.Autocomplete(element[0], {
          componentRestrictions: {country: 'SG'}
        });

        // Bind the place change property as a listener
        scope.$autocomplete.addListener('place_changed', (place) => {
          scope.$apply(() => {
            scope.$eval(attribute['placeChanged'], {
              '$event': scope.$autocomplete.getPlace()
            });
          });
        });

        // Blur on enter
        element[0].addEventListener("keypress", function(event) {
          if (event.key === "Enter") this.blur();
        });

        // Hack to get ionic fast tap working nicely with google maps
        // see http://ionicframework.com/docs/v1/api/page/tap/
        element[0].addEventListener("focus", function(event) {
          const pacContainers = document.querySelectorAll('.pac-container');
          for (let pac of pacContainers) { pac.dataset.tapDisabled = true; }
        });

      })
    }
  }
}
