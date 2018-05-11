module.exports = function(grunt) {
  grunt.initConfig({
    'closure-compiler': {
      library: {
        files: {
          'featureFlags.min.js': ['featureFlags.js']
        },
        options: {
          compilation_level: 'ADVANCED_OPTIMIZATIONS',
          language_in: 'ECMASCRIPT5_STRICT',
          output_wrapper: '(function() {%output%}).call(window)',
        }
      }
    }
  });

  require('google-closure-compiler').grunt(grunt);

  grunt.registerTask('production', ['closure-compiler:library']);
  grunt.registerTask('default', ['production']);
};