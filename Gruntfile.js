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
          // from your Google API key
          clientId: '785010223027.apps.googleusercontent.com',
          clientSecret: 'nwQ2UedRysgbNZl6jE3I77Ji',
          // output format
          saveJson: true,
          // options for JSON
          prettifyJson: true,
          // do parseInt, parseFloat, or split(',') automatically
          typeDetection: true,
          // can also be specified manually to 'number', 'string', or 'array'
          typeMapping: {
            col1: 'string',
            col4: 'arr'
          }
        },
        files: {
          // local save path : link to your worksheet
          'Sheet1.json': 'https://docs.google.com/spreadsheet/ccc?key=0AmPyOqJNrt_SdGlZOVlrc2UzS3FpV1V6Ri1jX0haSlE#gid=0',
          'Sheet2.json': 'https://docs.google.com/spreadsheet/ccc?key=0AmPyOqJNrt_SdGlZOVlrc2UzS3FpV1V6Ri1jX0haSlE#gid=1'
        }
      },
      // save as csv
      products2: {
        options: {
          clientId: '785010223027.apps.googleusercontent.com',
          clientSecret: 'nwQ2UedRysgbNZl6jE3I77Ji'
        },
        files: {
          'Sheet1.csv': 'https://docs.google.com/spreadsheet/ccc?key=0AmPyOqJNrt_SdGlZOVlrc2UzS3FpV1V6Ri1jX0haSlE#gid=0',
          'Sheet2.csv': 'https://docs.google.com/spreadsheet/ccc?key=0AmPyOqJNrt_SdGlZOVlrc2UzS3FpV1V6Ri1jX0haSlE#gid=1',
          // empty file will be saved too
          'Sheet3.csv': 'https://docs.google.com/spreadsheet/ccc?key=0AmPyOqJNrt_SdGlZOVlrc2UzS3FpV1V6Ri1jX0haSlE#gid=2'
        }
      },
      products3: {
        options: {
          clientId: '785010223027.apps.googleusercontent.com',
          clientSecret: 'nwQ2UedRysgbNZl6jE3I77Ji',
          saveJson: true,
          prettifyJson: true,
          typeDetection: true,
          typeMapping: {
            col1: 'string',
            col4: 'arr'
          }
        },
        files: [
          {
            dest: 'Sheet2.json',
            src: 'https://docs.google.com/spreadsheet/ccc?key=0AmPyOqJNrt_SdGlZOVlrc2UzS3FpV1V6Ri1jX0haSlE#gid=1',
            // EXTENDING options above
            options: {
              prettifyJson: false,
              typeMapping: {
                col1: 'number'
              }
            }
          }
        ]
      }
    }
  });

  grunt.registerTask('default', ['coffee']);

};
