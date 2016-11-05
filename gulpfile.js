var gulp = require('gulp'),
	concat = require('gulp-concat'),
	rename = require('gulp-rename'),
	jshint = require('gulp-jshint'),
	stylish = require('jshint-stylish'),
	uglify = require('gulp-uglify'),
	babel = require('gulp-babel');

gulp.task('default', function() {
	gulp.src([
		'./ttk91js.compile.js',
		'./ttk91js.machine.js'
	])
	.pipe(jshint({esversion: 6}))
	.pipe(jshint.reporter(stylish))
	.pipe(babel({
		presets: ['es2015']
	}))
	.pipe(concat('ttk91js.dist.js'))
	.pipe(gulp.dest('./dist'))
	.pipe(uglify())
	.pipe(rename('ttk91js.dist.min.js'))
	.pipe(gulp.dest('./dist'));
});