import {defaultMapOptions, dashedLineIcons} from '../../shared/util'
import assert from 'assert'

export default function CreditCardInput(app) {
    app.factory('creditCardInput', [
        '$state',
        '$ionicModal',
        '$rootScope',
    function (
        $state,
        $ionicModal,
        $rootScope
    ) {
        var modalScope = $rootScope.$new(true);
        var modal = $ionicModal.fromTemplate(
            require("./creditCardInput.html"),
            {
                scope: modalScope,
            })
        var q = undefined;
        modalScope.submitted = function(s) {
            // TODO: Understand why does this work??
            q.resolve({
                card_number:   modalScope.$$childHead.$$childHead.$$childHead.creditCardNumber,
                cvv:           modalScope.$$childHead.$$childHead.$$childHead.cvc,
                expiry_month:  modalScope.$$childHead.$$childHead.$$childHead.expiryMonth,
                expiry_year:   modalScope.$$childHead.$$childHead.$$childHead.expiryYear,
            })
            q = null;
        }
        modalScope.$on('modal.hidden', () => {
            if (q) {
                q.reject();
                q = null;
            }
        })
        modalScope.cancelled = function () {
            q.reject();
            q = null;
        }
        console.log(modalScope);
        // _.extend(modalScope, {
        //     creditCardNumber: '',
        //     cvc: '',
        //     expiryYear: '',
        //     expiryMonth: '',
        // })

        return {
            getInput() {
                assert(!q);
                var pr = new Promise(function (resolve, reject) {
                    q = {
                        resolve, reject
                    }
                })

                pr
                .catch(() => {})
                .then(() => modal.hide());

                modal.show();
                return pr;
            }
        };
    }]);
};
