import gulp from 'gulp'
import child_process from 'child_process';

gulp.task('build_dev', function () {
    child_process.execSync('npx tsc', { stdio: 'inherit' });
    return gulp.src('./src/**/*.ts');
});

gulp.task('build', gulp.series(['build_dev']));

gulp.task('default', gulp.series(['build']));
