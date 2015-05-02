var gulp = require('./node_modules/gulp');
var config = require('./package.json');
var concat = require('./node_modules/gulp-concat');
var exec = require('child_process').exec;
var header = require('./node_modules/gulp-header');
var footer = require('./node_modules/gulp-footer');
var git = require('./node_modules/gulp-git');
var prompt = require('./node_modules/gulp-prompt');

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
    gulp.src('package.json')
    .pipe(prompt.prompt({
        type: 'input',
        name: 'commit',
        message: 'Please enter commit message...'
    },  function(res){
      // now add all files that should be committed
      // but make sure to exclude the .gitignored ones, since gulp-git tries to commit them, too
      return gulp.src([ '!node_modules/', './*' ], {buffer:false})
      .pipe(git.commit(res.commit));
    }));
});

gulp.task('push', function(){
  git.push('origin', 'master', function (err) {
    if (err) throw err;
  });
});

gulp.task('publish', ['push']);

gulp.task('connect', function() {
    exec('apiary preview --server --port=' + config.apiaryPreviewPort, logOutput);
});

gulp.task('default', ['connect'], function(done){
    gulp.watch(apibFiles, ['validate']);
});