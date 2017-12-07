export default function() {
  function linkFn(scope, elem, attrs) {
    scope.currency = scope.currency || "$"
    scope.integer = 0
    scope.fraction = 0

    scope.$watch("value", function() {
      let floatValue = parseFloat(scope.value)
      if (!isFinite(floatValue)) {
        ;[scope.integer, scope.fraction] = ["", ""]
      } else {
        ;[scope.integer, scope.fraction] = parseFloat(scope.value)
          .toFixed(2)
          .split(".")
      }
    })
  }

  return {
    link: linkFn,
    restrict: "E",
    transclude: true,
    scope: {
      value: "=value",
      currency: "=?",
    },
    template: `
<span class="currency">{{currency}}</span>
<span class="fraction">{{integer}}.{{fraction}}</span>
    `,
  }
}
