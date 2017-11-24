import loadingTemplate from '../templates/loading.html'
import assert from 'assert'

/**

loadingSpinner(promise1);
loadingSpinner(promise2);

Equivalent to: loadingSpinner(Promise.all([promise1, promise2]))

loadingSpinner(promise)

Almost equivalent to (but subject to the above):
try {
  $ionicLoading.show(...);
  await promise;
} finally {
  $ionicLoading.hide();
}

**/
export default ['$ionicLoading',
  function ($ionicLoading) {
    /* Number of promises being watched by loading spinner */
    let count = 0

    function hide () {
      count = Math.max(0, count - 1)
      if (count === 0) {
        $ionicLoading.hide()
      }
    }
    function show () {
      if (count === 0) {
        $ionicLoading.show({template: loadingTemplate})
      }
      count = count + 1
    }

    return function (p) {
      assert.strictEqual(typeof p.then, 'function')
      show()

      p.then(hide, (err) => {
        hide()
        throw err
      })
      return p
    }
}]
