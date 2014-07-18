module.exports = (grunt) ->

  grunt.loadTasks 'tasks'
  grunt.loadNpmTasks 'grunt-contrib-coffee'

  grunt.initConfig
    coffee:
      compile:
        options:
          bare: true
        files:
          'tasks/gss.js': 'src/gss.coffee'
    # https://docs.google.com/spreadsheets/d/18DpYlL7ey3OTbXnTeDl82wD4ISq6iU2Gv5wCQjJsMuQ/edit#gid=1369557937
    gss:
      products:
        options:
          # from your Google API key
          clientId: '785010223027.apps.googleusercontent.com'
          clientSecret: 'nwQ2UedRysgbNZl6jE3I77Ji'
          # output format
          saveJson: true
          # options for JSON
          prettifyJson: true
          # do parseInt, parseFloat, or split(',') automatically
          typeDetection: true
          # can also be specified manually to 'number', 'string', or 'array'
          typeMapping:
            col1: 'string'
            # 'undefined' will not be saved
            col2: 'undefined'
            col4: (val) ->
              if not val.join then val.split '|'
              else val.join(',').split('|').map (v) -> v.split ','
        files:
          # local save path : link to your worksheet
          'Sheet1.json': 'https://docs.google.com/spreadsheets/d/18DpYlL7ey3OTbXnTeDl82wD4ISq6iU2Gv5wCQjJsMuQ/edit#gid=1428256717'
          'Sheet2.json': 'https://docs.google.com/spreadsheets/d/18DpYlL7ey3OTbXnTeDl82wD4ISq6iU2Gv5wCQjJsMuQ/edit#gid=1369557937'
      # save as csv
      products2:
        options:
          clientId: '785010223027.apps.googleusercontent.com'
          clientSecret: 'nwQ2UedRysgbNZl6jE3I77Ji'
        files:
          'Sheet1.csv': 'https://docs.google.com/spreadsheets/d/18DpYlL7ey3OTbXnTeDl82wD4ISq6iU2Gv5wCQjJsMuQ/edit#gid=1428256717'
          'Sheet2.csv': 'https://docs.google.com/spreadsheets/d/18DpYlL7ey3OTbXnTeDl82wD4ISq6iU2Gv5wCQjJsMuQ/edit#gid=1369557937'
          # empty file will be saved too
          'Sheet3.csv': 'https://docs.google.com/spreadsheet/ccc?key=18DpYlL7ey3OTbXnTeDl82wD4ISq6iU2Gv5wCQjJsMuQ#gid=295788079'
      products3:
        options:
          clientId: '785010223027.apps.googleusercontent.com'
          clientSecret: 'nwQ2UedRysgbNZl6jE3I77Ji'
          saveJson: true
          prettifyJson: true
          typeDetection: true
          typeMapping:
            col1: 'string'
            col4: 'array'
        files: [
            dest: 'Sheet3.json'
            src: 'https://docs.google.com/spreadsheets/d/18DpYlL7ey3OTbXnTeDl82wD4ISq6iU2Gv5wCQjJsMuQ/edit#gid=295788079'
            # EXTENDING options above
            options:
              prettifyJson: false
              typeMapping:
                col1: 'number'
        ]

  grunt.registerTask 'default', ['gss']
