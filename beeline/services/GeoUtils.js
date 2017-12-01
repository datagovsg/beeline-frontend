angular
  .module("beeline")
  .factory("lngLatDistance", () => lngLatDistance)
  .factory("bearingFromLngLats", () => bearingFromLngLats)

function lngLatDistance(ll1, ll2) {
  let rr1 = [ll1[0] / 180 * Math.PI, ll1[1] / 180 * Math.PI]
  let rr2 = [ll2[0] / 180 * Math.PI, ll2[1] / 180 * Math.PI]

  let dx = (rr1[0] - rr2[0]) * Math.cos(0.5 * (rr1[1] + rr2[1]))
  let dy = rr1[1] - rr2[1]

  let dist = Math.sqrt(dx * dx + dy * dy) * 6371000
  return dist
}

function bearingFromLngLats(ll1, ll2) {
  let rr1 = [ll1[0] / 180 * Math.PI, ll1[1] / 180 * Math.PI]
  let rr2 = [ll2[0] / 180 * Math.PI, ll2[1] / 180 * Math.PI]

  let dx = (rr2[0] - rr1[0]) * Math.cos(0.5 * (rr1[1] + rr2[1]))
  let dy = rr2[1] - rr1[1]

  return Math.atan2(dx, dy)
}
