var gulp = require('./node_modules/gulp');
var config = require('./package.json');
var concat = require('./node_modules/gulp-concat');
var exec = require('child_process').exec;
var header = require('./node_modules/gulp-header');
var footer = require('./node_modules/gulp-footer');

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

gulp.task('connect', function() {
    exec('apiary preview --server --port=' + config.apiaryPreviewPort, logOutput);
});

gulp.task('default', ['connect'], function(done){
    gulp.watch(apibFiles, ['validate']);
});