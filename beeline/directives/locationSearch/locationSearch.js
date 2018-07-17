angular.module('beeline').directive('locationSearch', function () {
  return {
    scope: {
      queryLocation: '=',
      ph: '@',
      isFiltering: '<',
      icon: '@',
    },
    template: `
      <div class="location-search item item-icon-left">
        <i class="icon pickup-stop" ng-if="icon === 'pickup'"></i>
        <i class="icon dropoff-stop" ng-if="icon === 'dropoff'"></i>
        <div angucomplete-alt
          placeholder="{{ph}}"
          pause="500"
          selected-object="selectedLocation"
          remote-url="https://developers.onemap.sg/commonapi/search?returnGeom=Y&getAddrDetails=Y&searchVal="
          remote-url-data-field="results"
          title-field="ADDRESS"
          description-field="description"
          minlength="2"
          input-class="form-control form-control-small"
          match-class="highlight"
          remote-url-response-formatter="formatResponse">
        </div>
      </div>
    `,
    link (scope, elem, attr) {
      scope.$watch('selectedLocation', loc => {
        scope.queryLocation = loc
      })

      scope.formatResponse = response => {
        response.results.map(result => {
          result.ADDRESS = result.ADDRESS.toLowerCase()
          return result
        })

        return response
      }
    },
  }
})
