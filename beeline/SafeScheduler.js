import assert from 'assert'

/**
 * A scheduler used to trigger a Promise both immediately and at the given time
 */
export class SafeScheduler {
  /**
   * Creates a SafeScheduler, invoking the callback which has to return a Promise,
   * and setting the function to trigger again at the given timestamp
   * @param {Function} fn - a 0-arg callback returning a Promise
   * @param {Number} millis - a timestamp representing when fn should be called again
   */
  constructor (fn, millis) {
    this.isRunning = false
    this.timeout = null

    // fn returns a Promise
    this.loop = function () {
      this.timeout = null

      fn()
        .then(() => {
          if (this.isRunning) {
            this.timeout = setTimeout(this.loop, millis - Date.now())
          }
        })
        .catch(() => {
          if (this.isRunning) {
            this.timeout = setTimeout(this.loop, 60000 /* retryTimeout */)
          }
        })
    }.bind(this)
  }

  /**
   * Stops the scheduler from triggering
   */
  stop () {
    this.isRunning = false
    if (this.timeout !== null) {
      clearTimeout(this.timeout)
    }
  }

  /**
   * Starts the scheduler, which will trigger at the given time
   */
  start () {
    assert(!this.isRunning)
    this.isRunning = true
    this.loop()
  }
}
