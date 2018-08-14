const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync').create();
const del = require('del');
const wiredep = require('wiredep').stream;
const runSequence = require('run-sequence');
var responsive = require('gulp-responsive-images');

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

let dev = true;

gulp.task('styles', () => {
    return gulp.src('app/css/*.scss')
        .pipe($.plumber())
        .pipe($.if(dev, $.sourcemaps.init()))
        .pipe($.sass.sync({
            outputStyle: 'expanded',
            precision: 10,
            includePaths: ['.']
        }).on('error', $.sass.logError))
        .pipe($.autoprefixer({
            browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']
        }))
        .pipe($.if(dev, $.sourcemaps.write()))
        .pipe(gulp.dest('.tmp/cs'))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('scripts', () => {
    return gulp.src('app/js/**/*.js')
        .pipe($.plumber())
        .pipe($.if(dev, $.sourcemaps.init()))
        .pipe($.babel())
        .pipe($.if(dev, $.sourcemaps.write('.')))
        .pipe(gulp.dest('.tmp/js'))
        .pipe(reload({
            stream: true
        }));
});

function lint(files) {
    return gulp.src(files)
        .pipe($.eslint({
            fix: true
        }))
        .pipe(reload({
            stream: true,
            once: true
        }))
        .pipe($.eslint.format())
        .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
}

gulp.task('lint', () => {
    return lint('app/js/**/*.js')
        .pipe(gulp.dest('app/js'));
});
gulp.task('lint:test', () => {
    return lint('test/spec/**/*.js')
        .pipe(gulp.dest('test/spec'));
});

gulp.task('html', ['styles', 'scripts'], () => {
    return gulp.src('app/*.html')
        .pipe($.useref({
            searchPath: ['.tmp', 'app', '.']
        }))
        .pipe($.if(/\.js$/, $.uglify({
            compress: {
                drop_console: true
            }
        })))
        .pipe($.if(/\.css$/, $.cssnano({
            safe: true,
            autoprefixer: false
        })))
        .pipe($.if(/\.html$/, $.htmlmin({
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: {
                compress: {
                    drop_console: true
                }
            },
            processConditionalComments: true,
            removeComments: true,
            removeEmptyAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true
        })))
        .pipe(gulp.dest('dist'));
});

gulp.task('images', () => {
    return gulp.src('app/img/**/*')
        .pipe($.cache($.imagemin()))
        .pipe(gulp.dest('dist/img'));
});

gulp.task('images:clean', del.bind(null, ['app/img']));

gulp.task('images:responsive', function () {
    gulp.src('app/images/*')
        .pipe(responsive({
            '*.jpg': [{
                width: 320,
                suffix: '_320',
                quality: 60
            }, {
                width: 320 * 2,
                suffix: '_640',
                quality: 60
            }, {
                width: 780,
                suffix: '_780',
                quality: 60
            }],
        }))
        .pipe(gulp.dest('app/img'));
});

gulp.task('images:copyFixed', () => {
    return gulp.src([
        'app/images/fixed/*'
    ], {
        dot: true
    }).pipe(gulp.dest('app/img'));
});

gulp.task('img', () => {
    return new Promise(resolve => {
        dev = false;
        runSequence(['images:responsive', 'images:copyFixed'], resolve);
    });
});

gulp.task('fonts', () => {
    return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', function (err) {})
            .concat('app/fonts/**/*'))
        .pipe($.if(dev, gulp.dest('.tmp/fonts'), gulp.dest('dist/fonts')));
});

gulp.task('extras', () => {
    return gulp.src([
        'app/*',
        '!app/*.html',
        'app/data/*.json'
    ], {
        dot: true
    }).pipe(gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve', () => {
    runSequence(['clean', 'wiredep'], ['styles', 'scripts', 'fonts'], () => {
        browserSync.init({
            notify: false,
            port: 9000,
            server: {
                baseDir: ['.tmp', 'app'],
                routes: {
                    '/bower_components': 'bower_components'
                }
            }
        });

        gulp.watch([
            'app/*.html',
            'app/img/**/*',
            '.tmp/fonts/**/*',
            '.data/*.json'
        ]).on('change', reload);

        gulp.watch('app/css/**/*.scss', ['styles']);
        gulp.watch('app/js/**/*.js', ['scripts']);
        gulp.watch('app/fonts/**/*', ['fonts']);
        gulp.watch('bower.json', ['wiredep', 'fonts']);
    });
});

gulp.task('serve:images', () => {
    runSequence(['clean', 'images:clean'], ['img'], () => {
        browserSync.init({
            notify: false,
            port: 9000,
            server: {
                baseDir: ['.tmp', 'app'],
                routes: {
                    '/bower_components': 'bower_components'
                }
            }
        });

        gulp.watch([
            'app/*.html',
            'app/img/**/*',
            '.tmp/fonts/**/*',
            '.data/*.json'
        ]).on('change', reload);

        gulp.watch('app/css/**/*.scss', ['styles']);
        gulp.watch('app/js/**/*.js', ['scripts']);
        gulp.watch('app/fonts/**/*', ['fonts']);
        gulp.watch('bower.json', ['wiredep', 'fonts']);
    });
});

gulp.task('serve:dist', ['default'], () => {
    browserSync.init({
        notify: false,
        port: 9000,
        server: {
            baseDir: ['dist']
        }
    });
});

gulp.task('serve:test', ['scripts'], () => {
    browserSync.init({
        notify: false,
        port: 9000,
        ui: false,
        server: {
            baseDir: 'test',
            routes: {
                '/scripts': '.tmp/js',
                '/bower_components': 'bower_components'
            }
        }
    });

    gulp.watch('app/js/**/*.js', ['scripts']);
    gulp.watch(['test/spec/**/*.js', 'test/index.html']).on('change', reload);
    gulp.watch('test/spec/**/*.js', ['lint:test']);
});

// inject bower components
gulp.task('wiredep', () => {
    gulp.src('app/css/*.scss')
        .pipe($.filter(file => file.stat && file.stat.size))
        .pipe(wiredep({
            ignorePath: /^(\.\.\/)+/
        }))
        .pipe(gulp.dest('app/css'));

    gulp.src('app/*.html')
        .pipe(wiredep({
            'overrides': {
                'bootstrap': {
                    'main': ['dist\css\bootstrap.min.css']
                }
            },
            //exclude: ['bootstrap'],
            ignorePath: /^(\.\.\/)*\.\./
        }))
        .pipe(gulp.dest('app'));
});

gulp.task('build', ['lint', 'html', 'images', 'fonts', 'extras'], () => {
    return gulp.src('dist/**/*').pipe($.size({
        title: 'build',
        gzip: true
    }));
});

gulp.task('default', () => {
    return new Promise(resolve => {
        dev = false;
        runSequence(['clean', 'wiredep'], 'build', resolve);
    });
});
