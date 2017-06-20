# Building the App

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

1. Checkout the repo
```
$ git clone YOUR_REPO_URL_HERE build
$ cd build
$ git checkout YOUR_BRANCH_HERE
```

e.g. for `api.beeline.sg`:
```
$ git clone git@github.com:datagovsg/beeline-frontend-deploy.git
$ git checkout gh-pages
```

2. Build
```
$ gulp deploy
```

3. Push
```
$ cd build
$ git add .
$ git commit -m 'Deployment on 14 Jul 2016'
$ git push
```


