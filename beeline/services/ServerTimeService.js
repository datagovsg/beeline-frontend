angular.module("beeline").factory("ServerTime", [
  "$http",
  function($http) {
    class ServerTime {
      sync() {
        return new Promise(resolve => {
          if (this.localServerTimeDiff) {
            resolve()
          } else {
            return this._syncTime().then(() => resolve())
          }
        })
      }

      getTime() {
        return (
          Date.now() +
          parseInt(this.localServerTimeDiff ? this.localServerTimeDiff : 0)
        )
      }

      _syncTime() {
        const startTime = new Date()
        const handler = headers => {
          let timeDiff =
            new Date(headers.date) - new Date() + (new Date() - startTime) / 2
          this.localServerTimeDiff = timeDiff
        }

        // https://www.codeproject.com/Articles/790220/Accurate-time-in-JavaScript
        // return $http({url: "http://www.googleapis.com", method: 'GET'})
        return $http({
          url: "https://api.beeline.sg/user",
          method: "GET",
        }).then(
          response => handler(response.headers()),
          error => handler(error.headers())
        )
      }
    }

    const instance = new ServerTime()

    instance.sync()

    return instance
  },
])
