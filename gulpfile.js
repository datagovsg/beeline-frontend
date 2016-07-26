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
    gulp.src('./node_modules/angular-google-maps/dist/angular-google-maps.js')
        .pipe(gulp.dest('./www/js'))
    gulp.src('./node_modules/angular-simple-logger/dist/angular-simple-logger.js')
        .pipe(gulp.dest('./www/js'))
});

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
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

gulp.task('watch', ['sass', 'webpack', 'js-libraries'], function() {
  gulp.watch(paths.sass, ['sass']);
  gulp.watch(['www/templates/*.html', 'beeline/**/*.js', 'beeline/**/*.html'], ['webpack']);
});

gulp.task('hot-code-push', ['sass', 'webpack', 'js-libraries'], function (done) {
  promiseExec('cordova-hcp build')
  .then(done, done);
})

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
  .then(() => promiseExec('git init .', {cwd: path.resolve('build')}))
  .then(() => promiseExec('git pull', {cwd: path.resolve('build')}))
  // Pull the latest (avoid conflicts)
  .then(() => {
    fs.writeFileSync(path.resolve('build') + '/CNAME', 'app.beeline.sg')
  })
  .then(done, errHandler);
});

gulp.task('deploy-copy', ['deploy-prepare-git'], function (done) {
  return gulp.src('./www/**/*')
    .pipe(gulp.dest('build'))
})

gulp.task('deploy-build', ['deploy-copy'], function (done) {
  process.env.BACKEND_URL='https://api.beeline.sg'
  return webpackPrefix('build', done)
})

gulp.task('deploy', ['deploy-build'], function (done) {
  done();
})

gulp.task('deploy!', ['deploy'], function (done) {
  fs.writeFileSync(path.resolve('.tmp-commit-message'),
                    'Deploy on ' + new Date().toISOString() + ' by ')

  promiseExec('git add .', {cwd: path.resolve('build')})
  .then(() => promiseExec(`git commit -m "Deployed on ${new Date().toISOString()}"`, {cwd: path.resolve('build')}))
  .then(() => promiseExec('git push', {cwd: path.resolve('build')}))
  .catch(errHandler)
  .then(done)
});
