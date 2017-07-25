import assert from 'assert';

export class SafeInterval {
  constructor(fn, interval, retryTimeout) {
    this.isRunning = false;
    this.timeout = null;
    this.interval = interval
    this.fn = fn

    this.retryTimeout = retryTimeout || interval;
  }

  //fn returns a Promise
  loop() {
    this.timeout = null;

    var promise = this.currentPromise = this.fn();

    this.currentPromise
    .then(()=>{
      if (promise == this.currentPromise && this.isRunning) {
        this.timeout = setTimeout(() => this.loop(), this.interval);
      }
    })
    .catch((err) => {
      console.log(err)
      if (promise == this.currentPromise && this.isRunning) {
        this.timeout = setTimeout(() => this.loop(), this.retryTimeout);
      }
    })
  }

  stop() {
    this.isRunning = false;
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  /**
    `force()`
    - Forces the task to run immediately.

    `force(true)`
    - Forces the task to run immediately. Also restarts the timer
    **/
  force(interrupt = false) {
    if (interrupt) {
      this.stop()
      this.start()
    } else {
      this.fn()
    }
  }
}
