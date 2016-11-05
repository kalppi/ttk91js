var gulp = require('gulp'),
	concat = require('gulp-concat'),
	rename = require('gulp-rename'),
	jshint = require('gulp-jshint'),
	stylish = require('jshint-stylish'),
	uglify = require('gulp-uglify'),
	babel = require('gulp-babel'),
	browserify = require('browserify'),
	through2 = require('through2');

gulp.task('default', function() {
	gulp.src([
		'./ttk91js.js',
	])
	.pipe(through2.obj(function (file, enc, next) {
		browserify(file.path)
			.transform('stripify')
			.bundle(function(err, res){
				file.contents = res;

				next(null, file);
			});
	}))
	.pipe(babel({
		presets: ['es2015']
	}))
	.pipe(concat('ttk91js.dist.js'))
	.pipe(gulp.dest('./dist'))
	.pipe(uglify())
	.pipe(rename('ttk91js.dist.min.js'))
	.pipe(gulp.dest('./dist'));
});