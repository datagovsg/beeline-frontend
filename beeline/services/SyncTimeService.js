
angular.module('beeline')
.factory('SyncTimeService', function syncTimeService ($http) {
  var TimeDiffKey = 'Local-Server-TimeDiff';
  function handler(data, startTime) {
    if (data) {
      var TimeDiff=new Date(data.headers().date) - (new Date()) + ((new Date()) - startTime) / 2;
      window.localStorage.setItem(TimeDiffKey, TimeDiff);
    }
  }
  function SyncTime() {
    var startTime = new Date();
    // https://www.codeproject.com/Articles/790220/Accurate-time-in-JavaScript
    $http({
      url: 'http://www.googleapis.com',
      method: 'GET'
    }).then((response) => {
      handler(response, startTime)
    }, (error) => {
      handler(error, startTime)
    })
   }
   return {SyncTime : () => SyncTime()}
})
