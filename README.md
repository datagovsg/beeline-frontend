# Installation
Install dependencies 
 
    npm install 
 
## Android development
Install [Android Studio](https://developer.android.com/studio/index.html) 
Run `npm run install-android`

## iOS development
Install [Xcode](https://developer.apple.com/xcode/) for iOS development
Run `npm run install-ios`

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