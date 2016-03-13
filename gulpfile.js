/**
 * Created by relief_captain on 07/03/2016.
 */
var gulp = require('gulp');
var scss = require('gulp-scss');
var uglify = require('gulp-uglify');
var del = require('del');
var autoprefixer = require('gulp-autoprefixer');
var bSync = require('browser-sync').create();
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
var runSequence = require('run-sequence');
var concat = require('gulp-concat');
var composer = require('gulp-composer');
var zip = require('gulp-zip');
var sourcemaps = require('gulp-sourcemaps');

function customPlumber(msg){
  return plumber({
      errorHandler: notify.onError({
          title: msg || 'Gulp Error',
          message:"Error: <%= error.message %>"})
  });
};

gulp.task('css', function() {
    return gulp.src('sass/styles.scss').
    pipe(customPlumber('SASS Error')).
    pipe(scss()).
    pipe(autoprefixer()).
    pipe(gulp.dest('css')).
    pipe(bSync.reload({
        stream: true
    }));
});

gulp.task('concatjs', function(){
    return gulp.src([
        'jssrc/app/app.js',
        'jssrc/app/services/todoOptions.js',
        'jssrc/app/services/todoList.js',
        'jssrc/app/directives/todonavigation.js',
        'jssrc/app/directives/todoContent.js',
        'jssrc/app/directives/todoSettings.js',
        'jssrc/app/directives/todoItem.js',
        'jssrc/app/directives/todoEditItem.js',
        'jssrc/app/directives/todoListFile.js',
        'jssrc/app/directives/todoListAlpha.js',
        'jssrc/app/directives/todoListPriority.js',
        'jssrc/app/directives/todoListProject.js',
        'jssrc/app/directives/todoListContext.js',
        'jssrc/app/directives/todoListDueDate.js',
        'jssrc/app/directives/todoAddNew.js'
    ]).
    pipe(customPlumber('JS Error')).
    pipe(sourcemaps.init()).
    pipe(concat({
        path: 'app.js'
    })).
    pipe(sourcemaps.write()).
    pipe(gulp.dest('js')).
    pipe(bSync.reload({
        stream: true
    }));
});

gulp.task('js', ['concatjs'], function(){
    return gulp.src([
        'bower_components/angular/angular.js',
        'bower_components/angular-route/angular-route.js',
        //'bower_components/bootstrap/dist/js/bootstrap.js',
    ]).
    pipe(gulp.dest('js'));
});

gulp.task('watch', [ 'css', 'js', 'browserSync'], function(){
    gulp.watch('sass/**/*.scss', ['css']);
    gulp.watch('js/*.js', ['js']);
});

gulp.task('browserSync', function(){
    bSync.init({
        proxy: 'http://localhost:8000/apps/todo'
    });
});

gulp.task('clean:dist', function(){
    return del([
        'dist/**/*'
    ]);
});

gulp.task('clean:js', function(){
    return del([
        'js/**/*'
    ]);
});

gulp.task('clean:deploy', function(){
    return del([
        'package/**/*'
    ]);
});

gulp.task('copy:appinfo', function(){
    return gulp.src('appinfo/**/*').
    pipe(gulp.dest('package/todo/appinfo'));
});

gulp.task('copy:controller', function(){
    return gulp.src('controller/**/*').
    pipe(gulp.dest('package/todo/controller'));
});

gulp.task('copy:css', function(){
    return gulp.src('css/**/*').
    pipe(gulp.dest('package/todo/css'));
});

gulp.task('copy:img', function(){
    return gulp.src('img/**/*').
    pipe(gulp.dest('package/todo/img'));
});

gulp.task('copy:js', function(){
    return gulp.src('js/**/*').
    pipe(gulp.dest('package/todo/js'));
});

gulp.task('copy:service', function(){
    return gulp.src('service/**/*').
    pipe(gulp.dest('package/todo/service'));
});

gulp.task('copy:storage', function(){
    return gulp.src('storage/**/*').
    pipe(gulp.dest('package/todo/storage'));
});

gulp.task('copy:templates', function(){
    return gulp.src('templates/**/*').
    pipe(gulp.dest('package/todo/templates'));
});

gulp.task('copy:composer', function(){
    return gulp.src('composer.json').
    pipe(gulp.dest('package/todo/'));
});

gulp.task('copy:readme', function(){
    return gulp.src('readme.md').
    pipe(gulp.dest('package/todo/'));
});

gulp.task("composer", function(){
    return composer({
        "working-dir": "./package/todo",
        bin: "composer",
        "no-dev": true
    });
});

gulp.task('zip', function(){
    return gulp.src([
        'package/**/*'
    ]).
    pipe(zip('todo.zip')).
    pipe(gulp.dest('./'));
});

gulp.task('deploy', function(callback){
    runSequence(
        'clean:deploy',
        'clean:dist',
        'css',
        'js',
        'copy:appinfo',
        'copy:controller',
        'copy:css',
        'copy:img',
        'copy:js',
        'copy:service',
        'copy:storage',
        'copy:templates',
        'copy:composer',
        'copy:readme',
        'composer',
        'zip',
        callback
    );
});