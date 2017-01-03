
export default function(uiGmapGoogleMapApi) {
  return {
    scope: true,
    link(scope, element, attribute) {
      uiGmapGoogleMapApi.then((googleMaps) => {
        scope.$autocomplete = new googleMaps.places.Autocomplete(element[0]);

        scope.$autocomplete.addListener('place_changed', (place) => {
          scope.$apply(() => {
            scope.$eval(attribute['placeChanged'], {
              '$event': scope.$autocomplete.getPlace()
            })
          })
        })

        scope.$watch(() => scope.$eval(attribute['bounds']), (bounds) => {
          scope.$autocomplete.setBounds(bounds);
        })

        setTimeout(() => {
          const pacContainers = document.querySelectorAll('.pac-container');

          for (let pac of pacContainers) {
            pac.dataset.tapDisabled = true;
          }
        }, 300)
      })
    }
  }
}
