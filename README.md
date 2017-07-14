# Building the App 
 
Install dependencies 
 
    npm install 
 
Install the necessary command line tools: 
 
    npm install -g ionic 
    npm install -g cordova-hot-code-push-cli 
 
Install [Android Studio](https://developer.android.com/studio/index.html) 
 
Use android studio to create an android virtual device (AVD) to let us test the app locally. 
 
Install Xcode 
 
Add the platforms to cordova 
     
    ionic cordova platform add android 
    ionic cordova platform add ios 
 
Initialize the cordova-hot-code-push files 
 
    cordova-hcp build 
 
Build the platforms 
 
    ionic cordova build android 
    ionic cordova build ios 
 
Run them in the emulator 
 
    ionic cordova run android 
    ionic cordvoa run ios 
 
 
# Deploying the App as a static site 
 
## Deploying to a repo with an existing page 
 
    npm run live-build 
    npm run deploy 
 
 
# Pushing 
``` 
$ cd build 
$ git add . 
$ git commit -m 'Deployment on 14 Jul 2016' 
$ git push 
``` 