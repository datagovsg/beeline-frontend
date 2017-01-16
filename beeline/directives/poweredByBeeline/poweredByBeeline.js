export default function () {
  return {
    template: require('./poweredByBeeline.html'),
    restrict : 'E',
    replace: false,
    scope: {
      powerHide:'<?',
      suggestHide: '<?',
    },
    link: function(scope, elem, attr) {
      scope.openSuggestionLink = function(event) {
        event.preventDefault();
        window.open('https://www.beeline.sg/suggest.html', '_system');
      }
    }
  };
}
