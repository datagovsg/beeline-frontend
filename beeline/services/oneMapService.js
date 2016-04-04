import {NetworkError} from '../shared/errors'
import {formatDate, formatDateMMMdd, formatTime, formatUTCDate} from '../shared/format'

export default function init (app) {

    app.factory('oneMapService', function ($http) {
        var tokenRequest;
        return {
            token() {
                if (tokenRequest)
                    return tokenRequest;
                else {
                    return tokenRequest = $http.get('http://www.onemap.sg/API/services.svc/getToken?accessKEY=qo/s2TnSUmfLz+32CvLC4RMVkzEFYjxqyti1KhByvEacEdMWBpCuSSQ+IFRT84QjGPBCuz/cBom8PfSm3GjEsGc8PkdEEOEr')
                        .then((response) => {
                            console.log(response);
                            return response.data.GetToken[0].NewToken;
                        });
                }
            }
        }
    });
}
