var gulp = require('gulp');
var config = require('./package.json');
var concat = require('gulp-concat');
var exec = require('child_process').exec;
var header = require('gulp-header');
var footer = require('gulp-footer');
var git = require('gulp-git');
var prompt = require('gulp-prompt');

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

    gulp.src( apibFiles )
        .pipe( footer(['', ''].join('\n')) )
        .pipe( concat( config.docFile ) )
        .pipe( header(  fs.readFileSync(config.headerFile) ) )
        .pipe( gulp.dest( './' ) );
});

gulp.task('validate', ['build'], function(done) {
    exec('drafter -l ' + config.docFile, handleExecError(done));
});

var message;

gulp.task('message', ['build'], function(done){
    return gulp.src('package.json')
        .pipe(prompt.prompt({
            type: 'input',
            name: 'commit',
            message: 'Please enter commit message...'
        },  function(res) {
            message = res.commit;
        }));
});

gulp.task('commit', ['message'], function(done) {
    return gulp.src([ '!node_modules/', './*' ], {buffer:false})
               .pipe(git.commit(message));
});

gulp.task('push', ['commit'], function(done){
    return git.push('origin', 'master', function (err) {
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