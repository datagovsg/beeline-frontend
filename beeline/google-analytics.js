
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-79537959-1', 'auto');

export default function() {
  return ga;
}

angular.module('beeline')
.run(function ($rootScope) {
  $rootScope.$on('$stateChangeSuccess', (evt, state) => {
    // ga()
    ga('send', 'pageview', {
      page: state.url
    })
  })

  if (window.cordova) {
    window.cordova.getAppVersion.getVersionNumber().then((version) => {
      ga('set', 'appVersion', `${version}-${device.platform}`)
    })
    window.cordova.getAppName.getAppName().then((appName) => {
      ga('set', 'appName', appName)
    })
  }
  else {
    ga('set', 'appVersion', window.location.origin)
    ga('set', 'appName', 'Beeline Web')
  }
})
