import assert from 'assert';

export class SafeInterval {
  constructor(fn, interval, retryTimeout) {
    this.isRunning = false;
    this.timeout = null;

    retryTimeout = retryTimeout || interval;

    //fn returns a Promise
    this.loop = function() {
      this.timeout = null;

      fn()
      .then(()=>{
        if (this.isRunning) {
          this.timeout = setTimeout(this.loop, interval);
        }
      })
      .catch(() => {
        if (this.isRunning) {
          this.timeout = setTimeout(this.loop, retryTimeout);
        }
      })
    }.bind(this);
  }

  stop() {
    this.isRunning = false;
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
    }
  }

  start() {
    assert (!this.isRunning);
    this.isRunning = true;
    this.loop();
  }
}
