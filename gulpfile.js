var gulp = require('gulp');
var config = require('./package.json');
var concat = require('gulp-concat');
var exec = require('child_process').exec;
var header = require('gulp-header');
var footer = require('gulp-footer');
var git = require('gulp-git');
var prompt = require('gulp-prompt');
var runSequence = require('run-sequence');


var apibFiles = [
    './**/*.apib',
    '!./' + config.docFile,
    ];

var logOutput = function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
};

gulp.task('build', function(){
    var fs = require('fs');
    apibFiles.push('!./' + config.headerFile);

    return gulp.src( apibFiles )
        .pipe( footer(['', ''].join('\n')) )
        .pipe( concat( config.docFile ) )
        .pipe( header(  fs.readFileSync(config.headerFile) ) )
        .pipe( gulp.dest( './' ) );
});

gulp.task('validate', ['build'], function() {
    exec('drafter -l ' + config.docFile, logOutput);
});

gulp.task('add', function(){
  return gulp.src(['./*.apib', '!./node_modules/**'])
    .pipe(git.add());
});

// git commit task with gulp prompt
gulp.task('commit', function(){
    // just source anything here - we just wan't to call the prompt for now
    return gulp.src('package.json')
    .pipe(prompt.prompt({
        type: 'input',
        name: 'commit',
        message: 'Please enter commit message...'
    },  function(res){
      return gulp.src([ '!node_modules/', './*.apib' ], {buffer:false})
      .pipe(git.commit(res.commit));
    }));
});

gulp.task('push', ['commit'], function(){
  git.push('origin', 'master', function (err) {
    if (err) throw err;
  });
});

gulp.task('publish', function() {
    runSequence('build','commit', 'push');
});

gulp.task('connect', function() {
    exec('apiary preview --server --port=' + config.apiaryPreviewPort, logOutput);
});

gulp.task('default', ['connect'], function(done){
    gulp.watch(apibFiles, ['validate']);
});