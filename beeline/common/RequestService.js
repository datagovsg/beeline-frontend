import uuid from "uuid"

angular.module("common").factory("RequestService", [
  "$http",
  "$rootScope",
  function RequestService($http, $rootScope) {
    // ////////////////////////////////////////////////////////////////////////////
    // Private internal methods and variables
    // ////////////////////////////////////////////////////////////////////////////
    // General purpose wrapper for making http requests to server
    // Adds the appropriate http headers and token if signed in

    function beelineRequest(options) {
      options.url = process.env.BACKEND_URL + options.url
      options.headers = options.headers || {}
      let sessionToken = window.localStorage.sessionToken || null
      // Attach the session token if logged in
      if (sessionToken) {
        options.headers.authorization = "Bearer " + sessionToken
      }
      // Attach headers to track execution environment
      if (window.device) {
        options.headers["Beeline-Device-UUID"] = window.device.uuid
        options.headers["Beeline-Device-Model"] = window.device.model
        options.headers["Beeline-Device-Platform"] = window.device.platform
        options.headers["Beeline-Device-Version"] = window.device.version
        options.headers["Beeline-Device-Manufacturer"] =
          window.device.manufacturer
        options.headers["Beeline-Device-Serial"] = window.device.serial
      } else {
        window.localStorage.uuid = window.localStorage.uuid || uuid.v4()
        options.headers["Beeline-Device-UUID"] = window.localStorage.uuid
        options.headers["Beeline-Device-Model"] = window.navigator.userAgent
        options.headers["Beeline-Device-Platform"] = "Browser"
      }
      options.headers["Beeline-App-Name"] = $rootScope.o.APP.NAME.replace(
        /\s/g,
        ""
      )
      return $http(options)
    }

    /**
     * Send a standard http request to the endpoint defined in
     * `process.env.TRACKING_URL`. Usually used to retrieve recent pings to
     * determine trip vehicle location and bearing
     * @param {object} options - the standard options object, with one
     * exception - the url specified will be relative to `process.env.TRACKING_URL`
     * @return {object} the $http response
     */
    function tracking(options) {
      options.url = process.env.TRACKING_URL + options.url
      return $http(options)
    }

    // ////////////////////////////////////////////////////////////////////////////
    // Public external interface
    // ////////////////////////////////////////////////////////////////////////////
    return {
      beeline: beelineRequest,
      tracking,
    }
  },
])
