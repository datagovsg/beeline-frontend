angular.module('beeline').directive('tripCode', function () {
  return {
    template: `
<span class="ch c0">{{codeStr[0]}}</span><span
      class="ch c1">{{codeStr[1]}}</span><span
      class="ch c2">{{codeStr[2]}}</span><span
      class="ch c3">{{codeStr[3]}}</span>`,
    scope: {
      code: '=',
    },
    link: function (scope, elem, attr) {
      scope.$watch('code', code => {
        if (code) {
          scope.codeStr = code.toString()
        } else {
          scope.codeStr = ''
        }
      })

      let exit = false
      function delay (ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
      }
      scope.$on('$destroy', () => (exit = true))
      ;(async function () {
        while (!exit) {
          for (let i = 0; i < 4 && !exit; i++) {
            let charElem = elem[0].querySelector(`.c${i}`)

            if (charElem.classList.contains('shrink')) {
              charElem.classList.remove('shrink')
            } else {
              charElem.classList.add('shrink')
            }

            await delay(250)
          }
        }
      })().then(null, console.error)
    },
  }
})
