export default [
  "$http",
  function($http) {
    let tokenRequest
    return {
      token() {
        if (tokenRequest) {
          return tokenRequest
        } else {
          return (tokenRequest = $http
            .get(
              "http://www.onemap.sg/API/services.svc/getToken?accessKEY=qo/s2TnSUmfLz+32CvLC4RMVkzEFYjxqyti1KhByvEacEdMWBpCuSSQ+IFRT84QjGPBCuz/cBom8PfSm3GjEsGc8PkdEEOEr"
            )
            .then(response => {
              return response.data.GetToken[0].NewToken
            }))
        }
      },
    }
  },
]
