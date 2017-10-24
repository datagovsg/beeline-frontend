
angular.module('beeline')
.factory('SyncTimeService', function syncTimeService (UserService) {
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
    return UserService.verifySession().then((response) => handler(response, startTime), (error) => handler(error, startTime))
   }
   return {SyncTime : () => SyncTime()}
})
