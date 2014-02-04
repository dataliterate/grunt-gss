'use strict';

module.exports = function(grunt) {

  grunt.loadTasks('tasks');
  grunt.loadNpmTasks('grunt-contrib-coffee');

  grunt.initConfig({
    coffee: {
      compile: {
        options: {
          bare: true
        },
        files: {
          'tasks/gss.js': 'src/gss.coffee'
        }
      }
    },
    // https://docs.google.com/spreadsheet/ccc?key=0AmPyOqJNrt_SdGlZOVlrc2UzS3FpV1V6Ri1jX0haSlE#gid=1
    gss: {
      products: {
        options: {
          clientId: '785010223027.apps.googleusercontent.com',
          clientSecret: 'nwQ2UedRysgbNZl6jE3I77Ji',
          saveJson: true,
          prettifyJson: true,
          typeDetection: true,
          typeMapping: {
            col1: 'string',
            col4: 'array'
          }
        },
        files: {
          'Sheet1.json': 'https://docs.google.com/spreadsheet/ccc?key=0AmPyOqJNrt_SdGlZOVlrc2UzS3FpV1V6Ri1jX0haSlE#gid=0',
          'Sheet2.json': 'https://docs.google.com/spreadsheet/ccc?key=0AmPyOqJNrt_SdGlZOVlrc2UzS3FpV1V6Ri1jX0haSlE#gid=1'
        }
      }
    }
  });

  grunt.registerTask('default', ['coffee']);

};
