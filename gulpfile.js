var gulp = require('gulp');
var mocha = require('gulp-mocha');
var exit = require('gulp-exit');

gulp.task('test', [], function() {
  return gulp.src('test/**/*.js', { read: false })
    .pipe(mocha())
    .pipe(exit());
});
