import suggestionItemTemplate from './suggestionItem.html'

angular.module('beeline').directive('suggestionItem', [
  function () {
    return {
      restrict: 'E',
      replace: false,
      template: suggestionItemTemplate,
    }
  },
])
