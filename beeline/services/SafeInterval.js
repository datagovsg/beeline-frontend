import assert from 'assert';
export default function SafeInterval() {
  class SafeInterval {
    constructor(fn, interval) {
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
      
    pause(){
      console.log("PAUSE");
      this.isRunning = false;
      clearTimeout(this.timeout);
    }
      
    resume(){
      assert (!this.isRunning);
      this.isRunning = true;
      this.loop();
    }
  }
  
  return SafeInterval
}
