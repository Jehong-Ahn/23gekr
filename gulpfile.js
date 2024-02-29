const gulp = require('gulp');
const pug = require('gulp-pug');
const browserSync = require('browser-sync').create();

// Pug 파일을 HTML로 컴파일하고 브라우저를 새로 고침하는 태스크
gulp.task('pug', function() {
    return gulp.src('pug/**/*.pug')
        .pipe(pug({
            pretty: true
        }))
        .pipe(gulp.dest('dist'))
        .pipe(browserSync.stream()); // 컴파일된 파일을 browser-sync를 통해 스트림
});

// browser-sync를 사용하여 로컬 서버 시작
gulp.task('serve', function() {
    browserSync.init({
        server: {
            baseDir: 'dist' // 'dist' 디렉토리를 서버의 루트로 설정
        }
    });

    // Pug 파일이나 다른 정적 자산이 변경되면 관련 태스크를 실행하고 브라우저를 새로 고침
    gulp.watch('pug/**/*.pug', gulp.series('pug'));
    gulp.watch('layout.pug', gulp.series('pug'));

    // 'dist' 디렉토리 내의 모든 파일 변경 시 브라우저 자동 새로 고침
    gulp.watch('dist/**/*').on('change', browserSync.reload);
});

// 기본 태스크 설정
gulp.task('default', gulp.series('pug', 'serve'));
