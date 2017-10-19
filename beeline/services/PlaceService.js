
angular.module('beeline').factory('PlaceService', function placeService(uiGmapGoogleMapApi, LazyLoadService)  {
    var autocompleteService, placesService

    uiGmapGoogleMapApi.then((googleMaps) => {
      autocompleteService = LazyLoadService(() => new googleMaps.places.AutocompleteService());
      placesService = LazyLoadService(() => new google.maps.places.PlacesService(document.createElement('div')))
    })

    function getPlacePredictions (options) {
      return new Promise(function (resolve, reject) {
        if (!autocompleteService) reject()
        autocompleteService().getPlacePredictions(options,
          (predictions) => resolve(predictions))
      })
    }

    function getDetails (predictions, queryText) {
      return new Promise(function (resolve, reject) {
        // If no results found then nothing more to do
        if (!placesService || !predictions || predictions.length === 0) reject();

        placesService().getDetails({
          placeId: predictions[0].place_id
        }, (result) => {
          if (!result) reject();
          let place = {queryText: queryText};
          place = _.assign(place,result);
          resolve(place);
        })
      })
    }

    async function handleQuery(queryText) {
      let predictions = await getPlacePredictions({
        componentRestrictions: {country: 'SG'},
        input: queryText
      });

      let place = await getDetails(predictions, queryText);
      return place
    }

    return { handleQuery: (queryText) => handleQuery(queryText) }
})
