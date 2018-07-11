import EventEmitter from 'events'

angular.module('common').factory('MapService', () => new EventEmitter())

angular.module('common').factory('SearchEventService', [
  'GoogleAnalytics',
  GoogleAnalytics => {
    const emitter = new EventEmitter()
    emitter.on('search-item', data => {
      // ga site search
      // https://support.google.com/analytics/answer/1012264?hl=en
      let page = window.location.hash.substr(1) + '/search?q=' + data
      GoogleAnalytics.send('send', 'pageview', {
        page: page,
      })
    })
    return emitter
  },
])
