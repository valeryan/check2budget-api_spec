var gulp = require('gulp');
var config = require('./package.json');
var concat = require('gulp-concat');
var exec = require('child_process').exec;
var header = require('gulp-header');
var footer = require('gulp-footer');
var git = require('gulp-git');
var prompt = require('gulp-prompt');
var confirm = require('gulp-confirm');

var apibFiles = [
    './**/*.apib',
    '!./' + config.docFile,
];

function handleExecError(done){
    return function(err, stdout, stderr){
        if(err){
            done(err);
        }
        else{
            done();
        }

        console.log(stdout);
        console.log(stderr);
    }
}

gulp.task('build', function(){
    var fs = require('fs');
    apibFiles.push('!./' + config.headerFile);

    return gulp.src( apibFiles )
        .pipe( footer(['', ''].join('\n')) )
        .pipe( concat( config.docFile ) )
        .pipe( header(  fs.readFileSync(config.headerFile) ) )
        .pipe( gulp.dest( './' ) );
});

gulp.task('validate', ['build'], function(done) {
    exec('drafter -l ' + config.docFile, handleExecError(done));
});

// git commit task with gulp prompt
gulp.task('commit', function(done){
    // just source anything here - we just wan't to call the prompt for now
    gulp.src('package.json')
    .pipe(prompt.prompt({
        type: 'input',
        name: 'commit',
        message: 'Please enter commit message...'
    },  function(res) {
        gulp.src([ '!node_modules/', './*' ], {buffer:false})
        .pipe(git.commit(res.commit));
    }));
});

gulp.task('push', ['commit'], function(done){
    git.push('origin', 'master', function (err) {
        if (err) throw err;
    });
});

gulp.task('publish', ['push']);

gulp.task('connect', function(done) {
    exec('apiary preview --server --port=' + config.apiaryPreviewPort, handleExecError(done));
});

gulp.task('default', ['connect'], function(done){
    gulp.watch(apibFiles, ['validate']);
});