angular.module("beeline").factory("LazyLoadService", LazyLoadService)

function LazyLoadService() {
  return {
    lazyLoad: function(fn) {
      let hasValue = false
      let currentValue = null

      return () => {
        if (!hasValue) {
          hasValue = true
          currentValue = fn()
        }
        return currentValue
      }
    },
  }
}
