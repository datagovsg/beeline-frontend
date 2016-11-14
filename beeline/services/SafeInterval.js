import assert from 'assert';
export default function SafeInterval() {

    function SafeInterval(fn, interval) {
      console.log("START");
      this.isRunning = true;

      //fn returns a Promise
      this.loop = function() {
        fn()
        .then(()=>{
          if (this.isRunning) {
            this.timeout = setTimeout(this.loop, interval);
          }
        })
      }.bind(this);

      this.loop();
    }

    SafeInterval.prototype = {
      constructor: SafeInterval,
      pause: function(){
        console.log("PAUSE");
        this.isRunning = false;
        clearTimeout(this.timeout);
      },
      resume: function(){
        assert (!this.isRunning);
        this.isRunning = true;
        this.loop();
      }
    }

    return SafeInterval
}
