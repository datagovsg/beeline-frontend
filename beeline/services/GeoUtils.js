
angular.module('beeline')
.factory('LngLatDistance', () => LngLatDistance)
.factory('BearingFromLngLats', () => BearingFromLngLats)

function LngLatDistance(ll1, ll2) {
  var rr1 = [ll1[0] / 180 * Math.PI, ll1[1] / 180 * Math.PI]
  var rr2 = [ll2[0] / 180 * Math.PI, ll2[1] / 180 * Math.PI]

  var dx = (rr1[0] - rr2[0]) * Math.cos(0.5 * (rr1[1] + rr2[1]))
  var dy = rr1[1] - rr2[1]

  var dist = Math.sqrt(dx * dx + dy * dy) * 6371000
  return dist
}

function BearingFromLngLats(ll1, ll2) {
  var rr1 = [ll1[0] / 180 * Math.PI, ll1[1] / 180 * Math.PI]
  var rr2 = [ll2[0] / 180 * Math.PI, ll2[1] / 180 * Math.PI]

  var dx = (rr2[0] - rr1[0]) * Math.cos(0.5 * (rr1[1] + rr2[1]))
  var dy = rr2[1] - rr1[1]

  return Math.atan2(dx, dy)
}
