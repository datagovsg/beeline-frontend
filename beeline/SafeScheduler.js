import assert from 'assert';

export class SafeScheduler {
  constructor(fn, hours, minutes = 0, seconds = 0) {
    this.isRunning = false;
    this.timeout = null;

    //fn returns a Promise
    this.loop = function() {
      this.timeout = null;

      fn()
      .then(()=>{
        if (this.isRunning) {
          this.timeout = setTimeout(this.loop,
            new Date().setHours(hours, minutes, seconds) - Date.now()
          );
        }
      })
      .catch(() => {
        if (this.isRunning) {
          this.timeout = setTimeout(this.loop, 60000 /* retryTimeout */);
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
