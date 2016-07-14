

# Deploying the App as a static site

## Deploying to a repo with an existing page

1. Checkout the repo
```
$ git clone YOUR_REPO_URL_HERE
$ git checkout YOUR_BRANCH_HERE
```

e.g. for `api.beeline.sg`:
```
$ git clone git@github.com:datagovsg/beeline-frontend.git
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


