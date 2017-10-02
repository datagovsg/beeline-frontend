/**
  * Quick-and-dirty maps on Cordova implementation. Falls back to Google-maps
  * if window.device is not available
  */
import assert from 'assert'

// Adapted from
// https://github.com/xkjyeah/vue-google-maps/blob/vue2/src/manager.js
export const jsLoaded = new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
  if (typeof window === 'undefined') {
    // Do nothing if run from server-side
    return;
  }
  window['cdGoogleMapsJsInit'] = resolve
})

export const nativeLoaded = new Promise((resolve, reject) => {
  window['cdGoogleMapsNativeInit'] = resolve
})

export const loaded = Promise.all([jsLoaded, nativeLoaded])

let isSetUp = false

function load (options, loadCn) {
  if (typeof document === 'undefined') {
    // Do nothing if run from server-side
    return;
  }
  if (!isSetUp) {
    const googleMapScript = document.createElement('SCRIPT');

    if (Array.prototype.isPrototypeOf(options.libraries)) {
      options.libraries = options.libraries.join(',');
    }
    options['callback'] = 'cdGoogleMapsJsInit';

    let baseUrl = loadCn
      ? 'http://maps.google.cn/'
      : 'https://maps.googleapis.com/'

    let url = `${baseUrl}maps/api/js?` +
      Object.keys(options)
        .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(options[key]))
        .join('&');

    googleMapScript.setAttribute('src', url);
    googleMapScript.setAttribute('async', '');
    googleMapScript.setAttribute('defer', '');
    document.body.appendChild(googleMapScript);
  } else {
    throw new Error('You already started the loading of google maps');
  }
};

angular.module('cdGmap', [])
.provider('cdGmapSettings', function () {
  let useNativeMaps = false, jsMapSettings = {}

  this.useNativeMaps = function (u) {
    useNativeMaps = u
  }

  this.jsMapSettings = function (s) {
    jsMapSettings = s
  }

  this.$get = [function () {
    // Always load JS maps, because we still want it
    // for our search mechanism

    load(jsMapSettings)

    if (useNativeMaps) {
      document.addEventListener('deviceready', () => {
        assert(plugin.google && plugin.google.maps)
        window.cdGoogleMapsNativeInit()
      })
    } else {
      window.cdGoogleMapsNativeInit()
    }

    return {
      useNativeMaps,
      jsMapSettings,
    }
  }]
})
.factory('cdGmapApi', ['cdGmapSettings', function (cdGmapSettings) {
  return loaded.then(() => ({
    IconSetting ({url, scaledSize, anchor}) {
      return {
        url,
        scaledSize,
        anchor
      }
    }
  }))
}])

require('./CdGmapGoogleMap')
require('./CdGmapMarker')
require('./CdGmapCircle')
require('./CdGmapPolyline')
require('./CdGmapInfoWindow')
require('./filters')
