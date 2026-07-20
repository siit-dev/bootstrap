'use strict'

module.exports = config => {
  config.set({
    basePath: '../../..',
    browsers: ['ChromeHeadless'],
    client: {
      jasmine: {
        random: false
      }
    },
    files: [
      'dist/css/bootstrap.css',
      'scss/tests/runtime/runtime.test.js'
    ],
    frameworks: ['jasmine'],
    plugins: [
      'karma-chrome-launcher',
      'karma-jasmine'
    ],
    reporters: ['progress'],
    singleRun: true
  })
}
