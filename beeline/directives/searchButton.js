export default function() {
  return {
    restrict: 'E',
    replace: true,
    template: `
    <div class="search-button item" ui-sref="tabs.crowdstart-search">
      <i class="ion-map"></i>
      <span>&nbsp;&nbsp;Search in Map</span>
    </div>
    `,
  };
}
