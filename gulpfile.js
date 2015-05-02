'use strict';

var gulp = require('gulp');
var runSequence = require('run-sequence');
var plugins = require('gulp-load-plugins')();

var config = {
  source: ['**/*.js', '!node_modules/**'],
};

gulp.task('clear', function() { console.log('\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n'); });

gulp.task('jshint', function () {
  return gulp.src(config.source)
  .pipe(plugins.plumber())
  .pipe(plugins.jshint('.jshintrc'))
  .pipe(plugins.jshint.reporter('jshint-stylish'));
});

gulp.task('dev-iteration', function() {
  return runSequence('clear', 'jshint');
});

gulp.task('dev', ['dev-iteration'], function() {
  gulp.watch(config.source, ['dev-iteration']);
});

gulp.task('help', plugins.taskListing);

gulp.task('default', ['dev-iteration']);


