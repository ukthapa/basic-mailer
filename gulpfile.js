// Import all necessary modules
var gulp            = require( 'gulp' ),
    sass            = require( 'gulp-sass' ),
    inlineCss       = require( 'gulp-inline-css' ),
    bs              = require( 'browser-sync' ).create(),
    sequence        = require( 'run-sequence' ),
    plumber         = require( 'gulp-plumber' ),
    rename          = require( 'gulp-rename' ),
    data            = require( 'gulp-data' ),
    swig            = require( 'gulp-swig' ),
    gutil           = require( 'gulp-util' ),
    assetpath       = require( 'gulp-assetpaths' ),
    autoprefixer    = require( 'gulp-autoprefixer' ),
    imagemin        = require( 'gulp-imagemin' ),
    context         = require( './dev/test-data.js' );


// Assets and other's path   
var assetsURL       = "./assets/", 
    devUrl          = "./dev/",
    prodUrl         = "./prod/",
    liveURL         = "";// Use this url to replace the local image url to LIVE URL / Mailchimp URL or CDN url


// Tas: Optimize image
gulp.task('imgoptimize', function () {
    gulp.src(rawImages + "images/*")
        .pipe(imagemin())
        .pipe(gulp.dest(devUrl + "images"))
});

// Task: Compile stylesheet.sass and save it as stylesheet.css
gulp.task( 'sass', function() {
    gulp.src(assetsURL + "stylesheet.scss")
        .pipe(plumber(function(error) {
            gutil.log(gutil.colors.red(error.message));
            this.emit('end');
        })) // report errors w/o stopping Gulp
        .pipe(sass())
        .pipe(autoprefixer({browsers: ['last 2 version']}))
        .pipe( gulp.dest(devUrl + "css") );
});


// Task: Compile stylesheet.sass and save it as stylesheet.css
