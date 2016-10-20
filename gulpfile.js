///////////////////////////////////////////
//
//	Required Plugins
//	
//////////////////////////////////////////

var gulp            = require( 'gulp' ),
    sass            = require( 'gulp-sass' ),
    //inlineCss       = require( 'gulp-inline-css' ),
    //inlinesource    = require('gulp-inline-source'),
    browserSync     = require( 'browser-sync' ),
    reload          = browserSync.reload,
    sequence        = require( 'run-sequence' ),
    plumber         = require( 'gulp-plumber' ),
    rename          = require( 'gulp-rename' ),
    //data            = require( 'gulp-data' ),
    //swig            = require( 'gulp-swig' ),
    gutil           = require( 'gulp-util' ),
    assetpaths      = require( 'gulp-assetpaths' ), // Change paths of assets from one environment to another Works for anything included with href, src, or url attributes
    autoprefixer    = require( 'gulp-autoprefixer' ), // Prefix CSS for different browser 
    imagemin        = require( 'gulp-imagemin' ), // Optimize the images
    //del 			  = require( 'del'), // Delete the unwanted files and folder in production before going LIVE
    utm2html 	    = require('gulp-utm2html'),
    fs              = require('fs'),
    html_strip      = require('htmlstrip-native'),
    include      	= require('gulp-include'),
    substituter  	= require('gulp-substituter'),
    deleteLines     = require('gulp-delete-lines'),
    nodemailer      = require('nodemailer'),
    //context         = require( './dev/test-data.js' );
    config          = require('./assets/config.json');


///////////////////////////////////////////
//
//	Path 
//	
//////////////////////////////////////////

var assetsURL       = "./assets/", 
    devUrl          = "./dev/",
    prodUrl         = "./prod/",
    liveURL         = "", // Use this url to replace the local image url to LIVE URL / Mailchimp URL or CDN url
    utmCode			= ""; // UTM Code





///////////////////////////////////////////
//
//	Task: Optimize image
//	
//////////////////////////////////////////

gulp.task('imgoptimize', function () {
    gulp.src(assetsURL + 'images/*.{png,jpg,jpeg,gif,svg}')
        .pipe(imagemin())
        .pipe(gulp.dest(devUrl + "images"))
});


///////////////////////////////////////////
//
//	Task: Compile stylesheet.sass and save it as stylesheet.css
//	
//////////////////////////////////////////

gulp.task( 'sass', function() {
    gulp.src(assetsURL + "sass/*.scss")
        .pipe(plumber(function(error) {
            gutil.log(gutil.colors.red(error.message));
            this.emit('end');
        })) // report errors w/o stopping Gulp
        .pipe(sass())
        .pipe(autoprefixer({browsers: ['last 3 version']}))
        .pipe( gulp.dest(devUrl + "css") )
        .pipe(reload({stream:true}));
});



///////////////////////////////////////////
//
//	Task: HTML 
//	
//////////////////////////////////////////

gulp.task( 'html', function() {
    gulp.src(assetsURL + "*.html")
        .pipe(plumber(function(error) {
            gutil.log(gutil.colors.red(error.message));
            this.emit('end');
        })) // report errors w/o stopping Gulp 
        .pipe(rename("index.html"))    
        .pipe( gulp.dest(devUrl) )
        .pipe(reload({stream:true}));
});



///////////////////////////////////////////
//
//	Task: Browser-Sync
//	
//////////////////////////////////////////

gulp.task( 'browserSync', function() {
	browserSync.init([devUrl + 'css/*.css',  devUrl + '*.html'], {
	    server: {
	      baseDir: devUrl
	    }
  	});	
});



///////////////////////////////////////////
//
//	Task: Embbed the style in Head section in production
//	
//////////////////////////////////////////

gulp.task('embbedStyle', function(){
	gulp.src(devUrl + 'index.html')  
    .pipe(substituter({
      mediaqueryHeader: '<style type="text/css">',
      mediaqueryBody: '//= include ' + 'css/*.css',
      mediaqueryFooter: '</style>'
    }))
    .pipe(include())
    // .pipe(inlineCss({
    //     removeLinkTags: true
    // }))
    // .pipe(inlinesource())
    .pipe(deleteLines({
      'filters': [
      /<link\s+rel=["']/i
      ]
    }))
    .pipe(gulp.dest(prodUrl))
});



///////////////////////////////////////////
//
//	Task: Change path of all assets to target production url
//	
//////////////////////////////////////////

gulp.task('change-paths', function(){
  return gulp.src([devUrl + '*.html'])
    .pipe(assetpaths({
      newDomain:  liveURL,
      oldDomain : 'images/',
      docRoot : 'public_html',
      filetypes : ['jpg','jpeg','png','ico','gif','js','css'],
      //customAttributes: ['data-custom'],
      templates: true
     }))
    .pipe(gulp.dest(prodUrl))
});



///////////////////////////////////////////
//
//	Task: Add UTM CODE
//	
//////////////////////////////////////////

gulp.task('add-utm-code', function(){
  return gulp.src([devUrl + '*.html'])
    .pipe(utm2html({
        source: 'source',
        medium: 'medium',
        campaign: 'campaign',
        term: 'term',
        content: 'content'}))
    .pipe(gulp.dest(devUrl))
});


///////////////////////////////////////////
//
//	Task: Watch
//	
//////////////////////////////////////////

gulp.task('watch', function() {
    gulp.watch(assetsURL + '/sass/*.scss', ['sass']);
    gulp.watch(assetsURL + '*.html', ['html']);
    gulp.watch(devUrl + 'css/*.css');
});


///////////////////////////////////////////
//
//	Task: Default 
//	
//////////////////////////////////////////

gulp.task('default', ['sass', 'browserSync', 'html', 'watch']);




///////////////////////////////////////////
//
//	Task: Production Build 
//	
//////////////////////////////////////////

gulp.task( 'build', function() {

});





//********************************************
// Inorder to send test mail and litmus testing Read: https://github.com/darylldoyle/Gulp-Email-Creator
// 
// Command to send test mail :  gulp send --template="index.html"
// Command to send litmus for testing : gulp litmus --template="index.html"
//********************************************



///////////////////////////////////////////
//
//  Task: Send test mail 
//  
//////////////////////////////////////////

gulp.task('send', function () {
    return sendEmail(gutil.env.template, config.testing.to);
});



///////////////////////////////////////////
//
//  Task: Send test mail 
//  
//////////////////////////////////////////

gulp.task('litmus', function () {
    return sendEmail(gutil.env.template, config.litmus);
});

function sendEmail(template, recipient) {
    try {

        var options = {
            include_script : false,
            include_style : false,
            compact_whitespace : true,
            include_attributes : { 'alt': true }
        };

        var templatePath = prodUrl + template; // Inorder to send mail from dev environment, replace "prodUrl" by "devUrl"

        var transporter = nodemailer.createTransport({
            service: 'Mailgun',
            auth: {
                user: config.auth.mailgun.user,
                pass: config.auth.mailgun.pass
            }
        });

        var templateContent = fs.readFileSync(templatePath, encoding = "utf8");

        var mailOptions = {
            from: config.testing.from, // sender address
            to: recipient, // list of receivers
            subject: config.testing.subject + ' - ' + template, // Subject line
            html: templateContent, // html body
            text: html_strip.html_strip(templateContent, options)
        };

        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                return gutil.log(error);
            }else{
                return gutil.log('Message sent: ' + info.response);
            }
        });

    } catch (e) {
        if(e.code == 'ENOENT') {
            gutil.log('There was an error. Check your template name to make sure it exists in ' + prodUrl); // For dev environment, replace "prodUrl" by "devUrl"
        } else if(e instanceof TypeError) {
            gutil.log('There was an error. Please check your config.json to make sure everything is spelled correctly');
        } else {
            gutil.log(e);
        }
    }
}
