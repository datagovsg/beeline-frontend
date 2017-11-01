
angular.module('beeline')
.factory('ServerTime', ['UserService','$http',
  function(UserService, $http) {

    class ServerTime {

     syncIfNotSynced() {
       return new Promise((resolve) => {
         if (ServerTime.localServerTimeDiff) {
           resolve()
         } else {
           return syncTime().then(() => resolve())
         }
       })
     }

      getTime() {
        return Date.now() + parseInt(ServerTime.localServerTimeDiff)
      }

      getTimeAsync() {
        return this.syncIfNotSynced().then(() => {
           return Date.now() + parseInt(ServerTime.localServerTimeDiff)
        })
      }

    }
    // static variable
    ServerTime.localServerTimeDiff = null

    function handler(data, startTime) {
      if (data) {
        var timeDiff = new Date(data.headers().date) - (new Date()) + ((new Date()) - startTime) / 2;
        ServerTime.localServerTimeDiff = timeDiff
      }
    }

    function syncTime() {
      var startTime = new Date();
      // https://www.codeproject.com/Articles/790220/Accurate-time-in-JavaScript
      return $http({url: "http://www.googleapis.com", method: 'GET'}).then((response) => handler(response, startTime), (error) => handler(error, startTime))
     }


    return ServerTime
  }]
)
