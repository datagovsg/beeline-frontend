export default function() {
  function linkFn(scope, elem, attrs) {
    scope.default = scope.default || 0

    scope.valueGetterSetter = function(nv) {
      let newValue = parseInt(nv)
      if (arguments.length == 0) {
        return scope.value
      }
      if (!isFinite(newValue) || newValue > scope.max || newValue < scope.min) {
        return scope.value
      } else {
        return (scope.value = newValue)
      }
    }

    scope.up = function() {
      scope.value = parseInt(scope.value)
      if (!isFinite(scope.value)) {
        scope.value = scope.default
      }
      let newValue = scope.value + 1
      if (newValue > scope.max) {
        newValue = scope.max
      }
      scope.value = newValue
    }
    scope.down = function() {
      scope.value = parseInt(scope.value)
      if (!isFinite(scope.value)) {
        scope.value = scope.default
      }
      let newValue = scope.value - 1
      if (newValue < 1) {
        newValue = 1
      }
      scope.value = newValue
    }
  }

  return {
    link: linkFn,
    restrict: "E",
    transclude: true,
    scope: {
      value: "=ngModel",
      min: "=",
      max: "=",
      default: "=",
      placeholder: "@",
    },
    template: require("./qtyInput.html"),
  }
}
