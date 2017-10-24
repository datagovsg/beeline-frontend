
angular.module('beeline')
.factory('AccurateDate', function(SyncTimeService) {
  var TimeDiffKey = 'Local-Server-TimeDiff';

  class AccurateDate {
    constructor() {
      this.synced = false
      this.syncTimePromise = new Promise((resolve) => {
        if (window.localStorage.getItem(TimeDiffKey)) {
          resolve()
        } else {
          SyncTimeService.SyncTime().then(() => {
            resolve()
          })
        }
      })
      this.syncTimePromise.then(() => {
        this.synced = true
      })
    }

    getAccurateDate() {
      if (!this.synced) {
        return null
      } else {
        var date =  Date.now() + parseInt(window.localStorage.getItem(TimeDiffKey))
        return date
      }
    }
  }

  return AccurateDate

})
