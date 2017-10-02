
angular.module('cdGmap')

.filter('geojsonToLatLng', () => function (geojson) {
  /* Instead of returning a new object every time, for
  performance reasons, cache the lat lng literal on the object */
  if (geojson._latLngLiteral) {
    return geojson._latLngLiteral
  } else {
    Object.defineProperty(geojson, '_latLngLiteral', {
      enumerable: false, /* so that it's not converted to JSON e.g. during serialization */
      value: {
        lat: geojson.coordinates[1],
        lng: geojson.coordinates[0],
      },
      writable: true,
      configurable: true,
    })

    return geojson._latLngLiteral
  }
})
