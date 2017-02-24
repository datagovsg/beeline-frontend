var gulp = require('gulp');
var gutil = require('gulp-util');
//var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var webpack = require('webpack-stream');
var sourcemaps = require('gulp-sourcemaps');
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');

var paths = {
  sass: ['./scss/**/*.scss']
};
function errHandler(err) {
    console.log(err);
    this.emit('end');
}

gulp.task('default', ['sass', 'webpack', 'js-libraries', 'hot-code-push']);

gulp.task('js-libraries', function() {
    gulp.src('./node_modules/lodash/lodash.js')
        .pipe(gulp.dest('./www/js'))
    gulp.src('./node_modules/angular-google-maps/dist/angular-google-maps.js')
        .pipe(gulp.dest('./www/js'))
    gulp.src('./node_modules/angular-simple-logger/dist/angular-simple-logger.js')
        .pipe(gulp.dest('./www/js'))
    gulp.src('./node_modules/clipboard/dist/clipboard.min.js')
        .pipe(gulp.dest('./www/js'))
    gulp.src('./node_modules/ngclipboard/dist/ngclipboard.min.js')
        .pipe(gulp.dest('./www/js'))
});

gulp.task('sass', function(done) {
  gulp.src([
    './scss/ionic.app.scss',
    './scss/operator-grab.scss',
  ])
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

function webpackPrefix(PREFIX, done) {
  return gulp.src(['beeline/main.js', '!node_modules/**/*.js', '!www/**/*.js'])
    .pipe(sourcemaps.init())
    .pipe(webpack(require('./webpack.config.js'))
        .on('error', done))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest((PREFIX || 'www') + '/lib/beeline'))
    .on('error', done)
}

gulp.task('webpack', function(done) {
  return webpackPrefix(null,done);
});

gulp.task('hot-code-push', ['sass', 'webpack', 'js-libraries'], function (done) {
  if (process.env.NO_HOT_CODE_PUSH) {
    return done();
  }
  promiseExec('cordova-hcp build www')
  .then(done, done);
})

gulp.task('watch', ['sass', 'webpack', 'js-libraries'], function() {
  gulp.watch(paths.sass, ['sass']);
  gulp.watch(['www/templates/*.html', 'beeline/**/*.js', 'beeline/**/*.html'], ['webpack']);
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

/*** To deploy the app to Github pages ***/

function promiseExec(cmd, options) {
  return new Promise((resolve, reject) => {
    child_process.exec(cmd, options || {}, (err, stdout, stderr) => {
      console.log(stdout);
      console.log(stderr);

      return err ? reject(err) : resolve();
    })
  })
}

gulp.task('deploy-prepare-git', function (done) {
  // Ensure that build/ is a git repo
  new Promise((resolve, reject) => {
    fs.mkdir(path.resolve('build'), (err) => err ? resolve() : reject(err))
  })
  .then(done, errHandler);
});

gulp.task('deploy-copy', ['deploy-prepare-git','sass', 'js-libraries'], function (done) {
  return gulp.src('./www/**/*')
    .pipe(gulp.dest('build'))
})

gulp.task('deploy-build', ['deploy-copy'], function (done) {
  process.env.BACKEND_URL='https://api.beeline.sg'
  return webpackPrefix('build', done)
})

gulp.task('deploy-hot-code-push', ['deploy-build'], function (done) {
  sh.cp('cordova-hcp-live.json', 'cordova-hcp.json')
  fs.writeFileSync('build/CNAME', 'app.beeline.sg')

  promiseExec('cordova-hcp build build')
  .then(done, done);
})

gulp.task('deploy', ['deploy-build', 'deploy-hot-code-push'], function (done) {
  done();
})

/////////////////////////////////////////
////// Staging only
gulp.task('stg-deploy-prepare-git', function (done) {
  // Ensure that build/ is a git repo
  new Promise((resolve, reject) => {
    fs.mkdir(path.resolve('build-stg'), (err) => err ? resolve() : reject(err))
  })
  .then(done, errHandler);
});

gulp.task('stg-deploy-copy', ['stg-deploy-prepare-git', 'sass', 'js-libraries'], function (done) {
  return gulp.src('./www/**/*')
    .pipe(gulp.dest('build-stg'))
})

gulp.task('stg-deploy-build', ['stg-deploy-copy'], function (done) {
  process.env.BACKEND_URL='https://api.beeline.sg'
  return webpackPrefix('build-stg', done)
})

gulp.task('stg-deploy-hot-code-push', ['stg-deploy-build'], function (done) {
  fs.writeFileSync('cordova-hcp.json',
    fs.readFileSync('cordova-hcp-live.json', 'utf-8').replace('app.beeline.sg', 'app-staging.beeline.sg')
  )
  fs.writeFileSync('build-stg/CNAME', 'app-staging.beeline.sg')

  promiseExec('cordova-hcp build build-stg')
  .then(done, done);
})

gulp.task('stg-deploy', ['stg-deploy-build', 'stg-deploy-hot-code-push'], function (done) {
  done();
})
