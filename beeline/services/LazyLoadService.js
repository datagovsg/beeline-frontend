angular.module("beeline").factory("LazyLoadService", () => lazy)

function lazy(fn) {
  let hasValue = false
  let currentValue = null

  return () => {
    if (!hasValue) {
      hasValue = true
      currentValue = fn()
    }
    return currentValue
  }
}
