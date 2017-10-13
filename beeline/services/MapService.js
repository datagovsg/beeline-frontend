import EventEmitter from 'events'

angular.module('beeline')
.factory('MapService', () => new EventEmitter())


angular.module('beeline')
.factory('SearchEventService', (GoogleAnalytics) => {
  const emitter = new EventEmitter()
  emitter.on('search-item', (data) => {
    let page =  window.location.hash.substr(1)+'/search?q=' + data
    GoogleAnalytics('send', 'pageview', {
      page: page
    })
  })
  return emitter
})
