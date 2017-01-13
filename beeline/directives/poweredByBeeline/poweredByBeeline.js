export default function () {
  return {
    template: require('./poweredByBeeline.html'),
    restrict : 'E',
    replace: false,
    scope: {
      powerHide:'<?',
      suggestHide: '<?',
    },
  };
}
