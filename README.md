# Getting started
Beeline is built using the Ionic Framework, so install ionic CLI tools:

    npm install -g ionic

Install dependencies

    npm install

## Android development
Install [Android Studio](https://developer.android.com/studio/index.html)  

Run `npm run deploy-android` to build an unsigned apk. Then run the following two commands to sign and zipalign the apk respectively.

```bash
jarsigner -verbose \
          -sigalg SHA1withRSA \
          -digestalg SHA1 \
          -keystore {{YOUR_KEYSTORE}}.keystore \
          platforms/android/build/outputs/apk/android-release-unsigned.apk \
          {{YOUR_KEYSTORE_ALIAS}}

# https://developer.android.com/studio/command-line/zipalign.html
zipalign -v 4 \
    platforms/android/build/outputs/apk/android-release-unsigned.apk \
    platforms/android/build/outputs/apk/{{YOUR_APK_NAME}}.apk
```

NOTE: `zipalign` is part of the Android SDK. You will be able to find the binary at `{{ANDROID_SDK_DIRECTORY}}/build-tools/{{VERSION_NUMBER}}/zipalign`

## iOS development
NOTE: Cordova 7.x is not supported until nordnet/cordova-hot-code-push-local-dev-addon#20 merged. This is why in `package.json` we set the cordova version to `^6.5.0`.

Install [Xcode](https://developer.apple.com/xcode/) for iOS development  

Run `npm run install-ios`

When prompted whether to overwrite `config.xml` and `resources/`, select `No`

Open `platforms/ios/Beeline.xcodeproj` in Xcode

Select target platform to run (e.g. iPhone 6) and run it

# Building

`npm run build` for a single development build

`npm run build -- --production` for a production build

`npm run dev` to set up a build watch and local test server

`npm run dev-android` to set up a build watch, hot code push server, and test on emulator/device

`npm run deploy` to deploy the app to staging/production environments

# Pushing
```
$ cd build
$ git add .
$ git commit -m 'Deployment on 14 Jul 2016'
$ git push
```

# Folder Structure
- beeline: Main program code source code to be compiled by webpack
- hooks: Cordova hooks
- platforms: Cordova platform specific files
- plugins: Cordova plugins
- resources: Ionic resources for generating icons and splash screens
- scripts: Build scripts and miscellaneous tools
- scss: Main stylesheets to be compiled by webpack
- static: Base assets and folder structure used for the build
- www: Output folder that is wiped and recopied from static for each build

# Contributing
We welcome contributions to code open sourced by the Government Technology Agency of Singapore. All contributors will be asked to sign a Contributor License Agreement (CLA) in order to ensure that everybody is free to use their contributions.
