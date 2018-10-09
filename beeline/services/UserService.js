import _ from 'lodash'
import verifiedPromptTemplate from '../templates/verified-prompt.html'
import requestingVerificationCodeTemplate from '../templates/requesting-verification-code.html'
import sendingVerificationCodeTemplate from '../templates/sending-verification-code.html'
import registeringWithServerTemplate from '../templates/registering-with-server.html'
import EventEmitter from 'events'
const VALID_PHONE_REGEX = /^[8-9]{1}[0-9]{7}$/
const VALID_VERIFICATION_CODE_REGEX = /^[0-9]{6}$/
// user name must be at least 3 characters long, space in front
// or after non-space characters are ignored e.g. "   a c   ",
// "exe", "alieo" is valid name
const VALID_USER_NAME = /^\s*\S.+\S\s*$/
// This file is dynamically generated by webpack from environment variables

angular.module('beeline').factory('UserService', [
  '$ionicPopup',
  '$ionicLoading',
  '$rootScope',
  'LoginDialog',
  'loadingSpinner',
  'RequestService',
  function UserService (
    $ionicPopup,
    $ionicLoading,
    $rootScope,
    LoginDialog,
    loadingSpinner,
    RequestService
  ) {
    // ////////////////////////////////////////////////////////////////////////////
    // Private internal methods and variables
    // ////////////////////////////////////////////////////////////////////////////
    let sessionToken = window.localStorage.sessionToken || null
    let user = window.localStorage.beelineUser
      ? JSON.parse(window.localStorage.beelineUser)
      : null
    let userEvents = new EventEmitter()

    // Requests a verification code to be sent to a mobile number
    // Verification code is used to log in
    let sendTelephoneVerificationCode = function (number) {
      return RequestService.beeline({
        method: 'POST',
        url: '/users/sendTelephoneVerification',
        data: {
          telephone: '+65' + number,
          alphanumericId: $rootScope.o.APP.SMS_OTP_FROM.replace(/\s/g, ''),
          appName: $rootScope.o.APP.NAME,
        },
        headers: { 'Content-Type': 'application/json' },
      }).then(function () {
        return true
      })
    }

    // Submit the received code and number for verification to the server
    let verifyTelephone = function (telephoneNumber, code) {
      return RequestService.beeline({
        method: 'POST',
        url: '/users/verifyTelephone',
        data: {
          telephone: '+65' + telephoneNumber,
          code: code,
        },
      }).then(function (response) {
        sessionToken = response.data.sessionToken
        window.localStorage.setItem('sessionToken', sessionToken)
        user = response.data.user
        userEvents.emit('userChanged')
        window.localStorage.setItem('beelineUser', JSON.stringify(user))

        return user
      })
    }

    // Prepares an update of the telephone number
    // The returned update toke is used together with the verification number
    // @returns Promise.<update token>
    let requestUpdateTelephone = function (telephone) {
      return RequestService.beeline({
        url: '/user/requestUpdateTelephone',
        method: 'POST',
        data: { newTelephone: '+65' + telephone },
      }).then(function (response) {
        return response.data.updateToken
      })
    }

    // Really tell the server to update the telephone
    // number. Pass this function the updateToken returned by
    // requestUpdateTelephone and the verification key received
    // by SMS
    let updateTelephone = function (updateToken, verificationKey) {
      return RequestService.beeline({
        url: '/user/updateTelephone',
        method: 'POST',
        data: {
          code: verificationKey,
          updateToken: updateToken,
        },
      }).then(function (reponse) {
        user = reponse.data
        window.localStorage.setItem('beelineUser', JSON.stringify(user))
        return user
      })
    }

    // Updates user fields
    const updateUserInfo = function (update) {
      return RequestService.beeline({
        method: 'PUT',
        url: '/user',
        data: update,
      }).then(function (response) {
        user = response.data
        return user
      })
    }

    let logOut = function () {
      sessionToken = null
      user = null
      userEvents.emit('userChanged')
      delete window.localStorage.sessionToken
      delete window.localStorage.beelineUser
      return Promise.resolve()
    }

    // Queries the server to test if the session is still valid
    // Updates the user info if necessary
    // If the session is invalid then log out
    let verifySession = function () {
      return RequestService.beeline({
        url: '/user',
        method: 'GET',
      }).then(
        function (response) {
          user = response.data

          if (!user) {
            logOut() // user not found
            return false
          }
          userEvents.emit('userChanged')

          return true
        },
        function (error) {
          if (error.status === 403 || error.status === 401) {
            logOut()
            return false
          }
        }
      )
    }

    // ////////////////////////////////////////////////////////////////////////////
    // UI methods
    // ////////////////////////////////////////////////////////////////////////////
    let verifiedPrompt = function (options, hideCancel) {
      let promptScope = $rootScope.$new(true)
      promptScope.form = {
        verifiedPromptForm: {},
      }
      promptScope.data = {
        inputs: options.inputs || [],
        bodyText: options.bodyText || '',
      }
      let buttons = [
        {
          text: 'OK',
          type: 'button-positive',
          onTap: function (e) {
            if (promptScope.form.verifiedPromptForm.$valid) {
              return promptScope.data
            }
            e.preventDefault()
          },
        },
      ]
      if (!hideCancel) {
        buttons.unshift({ text: 'Cancel' })
      }
      _.defaultsDeep(options, {
        template: verifiedPromptTemplate,
        title: '',
        subTitle: '',
        scope: promptScope,
        buttons,
      })
      return $ionicPopup.show(options)
    }

    let promptTelephoneNumber = function (title, subtitle) {
      return verifiedPrompt({
        title: title,
        bodyText: subtitle,
        inputs: [
          {
            type: 'tel',
            name: 'phone',
            pattern: VALID_PHONE_REGEX,
            errorMsg:
              'The phone no. you provide does not appear to be in the correct format. Please provide a valid 8-digit phone no. starting with the number 8 or 9.',
          },
        ],
      })
    }

    let promptVerificationCode = function (telephone) {
      return verifiedPrompt({
        title: 'Verification',
        bodyText: 'Enter the 6-digit code sent to ' + telephone,
        inputs: [
          {
            type: 'tel',
            name: 'code',
            pattern: VALID_VERIFICATION_CODE_REGEX,
          },
        ],
      })
    }

    // The combined prompt for phone number and subsequent prompt for verification code
    let promptLogIn = async function () {
      try {
        // Ask for telephone number
        let result = await LoginDialog.show()
        // if user close the model
        if (!result) return
        let [telephoneNumber, wantVerification] = result
        if (!telephoneNumber) return

        if (wantVerification) {
          await loadingSpinner(sendTelephoneVerificationCode(telephoneNumber))
        }

        // Ask for verification code
        let verificationCode = await promptVerificationCode(telephoneNumber)
        if (!verificationCode) return
        let user = await loadingSpinner(
          verifyTelephone(telephoneNumber, verificationCode.code)
        )

        // Is the user name null?
        checkNewUser(user)
        return user
      } catch (error) {
        // If an error occurs at any point stop and alert the user
        if (error.status === 401) {
          $ionicPopup.alert({
            title: 'Incorrect login',
            subTitle: error && error.data && error.data.message,
          })
        } else {
          $ionicPopup.alert({
            title: 'Error while trying to connect to server.',
            subTitle: error && error.data && error.data.message,
          })
        }
        throw error // Allow the calling function to catch the error
      }
    }

    let loginIfNeeded = async function () {
      if (user) return user
      else {
        let user = await promptLogIn()
        if (user) return user
        else throw new Error('Log in aborted')
      }
    }

    const checkNewUser = async function (user) {
      if (user.name || user.email) {
        // Not a new user
        return
      }

      try {
        let accountResponse = await verifiedPrompt(
          {
            title: 'Account Details',
            bodyText:
              'Welcome! This looks like your first login. Please complete the account setup.',
            inputs: [
              {
                type: 'text',
                name: 'name',
                pattern: VALID_USER_NAME,
                inputPlaceHolder: 'Name',
                errorMsg: 'Please provide a name with 3 or more characters.',
              },
              {
                type: 'email',
                name: 'email',
                inputPlaceHolder: 'name@example.com',
                errorMsg:
                  'Email address does not appear to be in the correct format. Please provide a valid email address.',
              },
            ],
          },
          true
        )
        if (!accountResponse) {
          logOut()
          $rootScope.$digest()
          return
        } else {
          $ionicLoading.show({ template: registeringWithServerTemplate })
          await updateUserInfo({
            name: accountResponse.name,
            email: accountResponse.email,
          })
          $ionicLoading.hide()
        }
      } catch (error) {
        // If an error occurs at any point stop and alert the user
        $ionicLoading.hide()
        $ionicPopup.alert({
          title: 'Error while trying to connect to server.',
          subTitle: error && error.data && error.data.message,
        })
      }
    }

    // Similar to prompt login
    // The combined prompt for phone number and subsequent prompt for verification code
    let promptUpdatePhone = async function () {
      try {
        // Start by prompting for the phone number
        let telephoneResponse = await promptTelephoneNumber(
          'Update Phone Number',
          'Please enter your new 8-digit mobile number to receive a verification code.'
        )
        if (!telephoneResponse) return
        $ionicLoading.show({ template: requestingVerificationCodeTemplate })
        let telephone = telephoneResponse.phone
        let updateToken = await requestUpdateTelephone(telephone)
        $ionicLoading.hide()
        let updateCode = await promptVerificationCode(telephone)
        if (!updateCode) return
        $ionicLoading.show({ template: sendingVerificationCodeTemplate })
        await updateTelephone(updateToken, updateCode.code)
        $ionicLoading.hide()
        $ionicPopup.alert({
          title: 'Your phone number has been successfully updated.',
          subTitle: 'It is now ' + telephone,
        })
      } catch (error) {
        // If an error occurs at any point stop and alert the user
        $ionicLoading.hide()
        $ionicPopup.alert({
          title: 'Error updating phone number.',
          subTitle: error && error.data && error.data.message,
        })
      }
    }

    let promptUpdateUserInfo = async function (field) {
      try {
        let filedInput
        if (field === 'name') {
          filedInput = {
            type: 'text',
            name: 'name',
            pattern: VALID_USER_NAME,
            errorMsg: 'Please provide a name with 3 or more characters.',
          }
        }
        if (field === 'email') {
          filedInput = {
            type: 'email',
            name: 'email',
            errorMsg:
              "Email address doesn't appear to be in the correct format. Please provide a valid email address.",
          }
        }
        let verifiedResponse = await verifiedPrompt({
          title: 'Update ' + field,
          bodyText: 'Enter your new ' + field,
          inputs: [filedInput],
        })
        if (!verifiedResponse) return
        let update = {}
        update[field] = verifiedResponse[field]
        return updateUserInfo(update)
      } catch (error) {
        $ionicPopup.alert({
          title: `Error updating ${field}.`,
          template: '',
        })
      }
    }

    // Shows a confirmation dialogue asking if the user is sure they want to log out
    let promptLogOut = function () {
      $ionicPopup
        .confirm({
          title: 'Are you sure you want to log out?',
          subTitle:
            'You will not be able to make any bookings and view your tickets after you log out.',
        })
        .then(function (response) {
          if (response) {
            return logOut()
          }
        })
    }

    // Saves payment info to backend and update user object
    let savePaymentInfo = function (stripeTokenId) {
      return RequestService.beeline({
        method: 'POST',
        url: `/users/${user.id}/creditCards`,
        data: {
          stripeToken: stripeTokenId,
        },
      }).then(function (response) {
        user.savedPaymentInfo = response.data
      })
    }

    // Update/change payment info to backend and update user object
    let updatePaymentInfo = function (stripeTokenId) {
      return RequestService.beeline({
        method: 'POST',
        url: `/users/${user.id}/creditCards/replace`,
        data: {
          stripeToken: stripeTokenId,
        },
      }).then(function (response) {
        user.savedPaymentInfo = response.data
      })
    }

    // Remove payment info from backend and update user object
    let removePaymentInfo = function () {
      return RequestService.beeline({
        method: 'DELETE',
        url: `/users/${user.id}/creditCards/${
          user.savedPaymentInfo.sources.data[0].id
        }`,
      }).then(function (response) {
        user.savedPaymentInfo = response.data
      })
    }

    let sendEmailVerification = function () {
      return RequestService.beeline({
        method: 'POST',
        url: `/users/sendEmailVerification`,
      })
    }

    // ////////////////////////////////////////////////////////////////////////////
    // Initialization
    // ////////////////////////////////////////////////////////////////////////////
    verifySession()

    // ////////////////////////////////////////////////////////////////////////////
    // Public external interface
    // ////////////////////////////////////////////////////////////////////////////
    return {
      getUser: function () {
        return user
      },
      promptLogIn,
      loginIfNeeded,
      promptUpdatePhone,
      promptUpdateUserInfo,
      promptLogOut,
      userEvents,
      savePaymentInfo,
      updatePaymentInfo,
      removePaymentInfo,
      sendEmailVerification,
    }
  },
])
