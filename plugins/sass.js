/*
   Original acquired from:
   https://github.com/Sonaryr/eleventy-plugin-sass/blob/244ddf85f0b826b9a8f6c0bf01fc1def058f3069/index.js
 */
/*
MIT License

Copyright (c) 2019 Maarten Schroeven

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const _debounce = require('lodash.debounce');
const chokidar = require('chokidar');
const cleanCSS = require('gulp-clean-css');
const gulpIf = require('gulp-if');
const prefix = require('gulp-autoprefixer');
const sass = require('gulp-sass');
sass.compiler = require('node-sass');
const sourcemaps = require('gulp-sourcemaps');
const vfs = require('vinyl-fs');

const defaultOptions = {
    watch: ['**/*.{scss,sass}', '!node_modules/**'],
    sourcemaps: false,
    cleanCSS: true,
    cleanCSSOptions: {},
    autoprefixer: true,
    lint: true,
    config: {}
};

function monkeypatch(cls, fn) {
    const orig = cls.prototype[fn.name].__original || cls.prototype[fn.name];

    function wrapped() {
        return fn.bind(this, orig).apply(this, arguments);
    }

    wrapped.__original = orig;

    cls.prototype[fn.name] = wrapped;
}

const compileSass = _debounce(function (eleventyInstance, options) {
    vfs.src(options.watch)
        .pipe(gulpIf(options.sourcemaps, sourcemaps.init()))
        .pipe(sass(options.config).on('error', sass.logError))
        .pipe(gulpIf(options.autoprefixer, prefix()))
        .pipe(gulpIf(options.cleanCSS, cleanCSS(options.cleanCSSOptions)))
        .pipe(gulpIf(options.sourcemaps, sourcemaps.write('.')))
        .pipe(vfs.dest(eleventyInstance.outputDir))
        .on('end', function () {
            eleventyInstance.eleventyServe.reload();
        });
}, 500);

function initializeWatcher(eleventyInstance, options) {
    let firstRun = true;
    const watcher = chokidar.watch(options.watch, {
        persistent: true
    });
    watcher
        .on('add', path => {
            if (!firstRun) {
            }
            firstRun = false;
            compileSass(eleventyInstance, options);
        })
        .on('change', path => {
            compileSass(eleventyInstance, options);
        });
}

module.exports = {
    initArguments: {},
    configFunction: function (eleventyConfig, options) {
        setImmediate(function () {
            options = {...defaultOptions, ...options};
            let initialized = false;
            const Eleventy = require('@11ty/eleventy/src/Eleventy.js');
            if (Eleventy.prototype) {
                function write(original) {
                    if (!initialized && !this.isDryRun) {
                        compileSass(this, options);
                    }
                    return original.apply(this);
                }

                function watch(original) {
                    if (!initialized) {
                        initializeWatcher(this, options);
                        initialized = true;
                    }
                    return original.apply(this);
                }

                function serve(original, port) {
                    if (!initialized) {
                        initializeWatcher(this, options);
                        initialized = true;
                    }
                    return original.apply(this, [port]);
                }

                monkeypatch(Eleventy, write);
                monkeypatch(Eleventy, watch);
                monkeypatch(Eleventy, serve);
            }
        });
    }
};
