
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

export default function() {
  return ga;
}

angular.module('beeline')
.run(function ($rootScope) {
  if (window.cordova) {
    const GA_LOCAL_STORAGE_KEY = 'ga:clientId';
    // Set up cordova to use localstorage over cookies (file:/// doesn't
    // support cookies)
    ga('create', 'UA-79537959-1', {
      storage: 'none',
      clientId: localStorage.getItem(GA_LOCAL_STORAGE_KEY)
    });
    ga((tracker) => {
      localStorage.setItem(GA_LOCAL_STORAGE_KEY, tracker.get('clientId'));
    });

    // We have a file:/// URL, but tell GA to ignore it
    ga('set', 'checkProtocolTask', null);
  }
  else {
    ga('create', 'UA-79537959-1', 'auto');
  }
  // The first page view
  ga('send', 'pageview', {
    page: window.location.hash.substr(1)
  })

  $rootScope.$on('$stateChangeSuccess', (evt, state) => {
    ga('send', 'pageview', {
      page: window.location.hash.substr(1)
    })
  })

  if (window.cordova) {
    window.cordova.getAppVersion.getVersionNumber().then((version) => {
      ga('set', 'appVersion', `${version}-${device.platform}`)
    })
    window.cordova.getAppVersion.getAppName().then((appName) => {
      ga('set', 'appName', appName)
    })
  }
  else {
    ga('set', 'appVersion', window.location.origin)
    ga('set', 'appName', 'Beeline Web')
  }
})
