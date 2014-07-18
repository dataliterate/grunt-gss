# grunt-gss v0.5.0

> Save your Google Spreadsheets as CSV or JSON.


## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-gss --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-gss');
```

### Overview
Google Spreadsheet could be a simple yet powerful front end for average users to preform management to loads of JSON files.
A handy tool for [CouchDB](http://couchdb.apache.org/#download)-backed apps like [couch-web](https://github.com/h0ward/couch-web).


### Setup API key
1. Go to [API Console](https://code.google.com/apis/console) and create a project
2. Turn on **Drive API** in **APIS**
3. **Create new client ID** in **Credentials** and setup accordingly:
   Application type: **Web application**
   Authorized Javascript origins: **http://localhost/**
   Authorized redirect URI: **http://localhost:4477/**
4. Under **Consent screen**, set **Email address** and **Product name**
5. After the ID is created, you will see your `clientId` and `clientSecret`


### Share spreadsheet
1. Check out demo file [here](https://docs.google.com/spreadsheet/ccc?key=0AmPyOqJNrt_SdGlZOVlrc2UzS3FpV1V6Ri1jX0haSlE#gid=1#gid=1).
2. `key` and `gid` could be found in the URL of your spreadsheet
3. Do it as usual under **File > Share**
4. Without proper permission set, you will get a **File not found** error from Google


### Task Options
 1. `clientId` and `clientSecret` are from your Google API key
 2. `saveJson` set to true to save as JSON, otherwise CSV is saved
 3. `prettifyJson` works for JSON format only
 4. `typeDetection` apply one of these: `parseInt`, `parseFloat`, or `split(',')`
 5. `typeMapping` an object containing `col:type` mappings. Possible types are:
  * array - split value by ',', and for those who wanted multi dimension support, use callback
  * number - `parseInt` if the value consists only numbers, and `parseFloat` if any `,`
  * string - Raw
  * undefined - field and value will be removed from result
  * or a callback function accepting value and returning whatever can be parsed by JSON.parse

*Note: If both `typeDetection` and `typeMapping` are `true`, `typeDetection` will be executed first, and followed by `typeMapping` overriding the outcome. That is, value passing to`typeMapping` callback may not be `string`.*


### The Task
Three ways to setup file mappings. Will take [these sheets](
  // https://docs.google.com/spreadsheets/d/18DpYlL7ey3OTbXnTeDl82wD4ISq6iU2Gv5wCQjJsMuQ/edit#gid=1369557937) as examples.

#### Example 1
```coffeescript
grunt.initConfig
  gss:
    example1:
      options:
        clientId: '785010223027.apps.googleusercontent.com'
        clientSecret: 'nwQ2UedRysgbNZl6jE3I77Ji'
        saveJson: true
        prettifyJson: true
        typeDetection: true
        typeMapping:
          col1: 'string'
          col2: 'undefined'
          # make it 2D
          col4: (val) ->
            # typeDetection is true, value may already be spited into array
            if not val.join then val.split '|'
            else val.join(',').split('|').map (v) -> v.split ','
      files:
        # local save path : link to your worksheet
        'Sheet1.json': 'https://docs.google.com/spreadsheets/d/18DpYlL7ey3OTbXnTeDl82wD4ISq6iU2Gv5wCQjJsMuQ/edit#gid=1428256717'
        'Sheet2.json': 'https://docs.google.com/spreadsheets/d/18DpYlL7ey3OTbXnTeDl82wD4ISq6iU2Gv5wCQjJsMuQ/edit#gid=1369557937'
```

#### Example 2
```coffeescript
example2:
  options:
    clientId: '785010223027.apps.googleusercontent.com'
    clientSecret: 'nwQ2UedRysgbNZl6jE3I77Ji'
  files:
    'Sheet1.csv': 'https://docs.google.com/spreadsheets/d/18DpYlL7ey3OTbXnTeDl82wD4ISq6iU2Gv5wCQjJsMuQ/edit#gid=1428256717',
    'Sheet2.csv': 'https://docs.google.com/spreadsheets/d/18DpYlL7ey3OTbXnTeDl82wD4ISq6iU2Gv5wCQjJsMuQ/edit#gid=1369557937',
    # empty file will *NOT* be saved
    'Sheet3.csv': 'https://docs.google.com/spreadsheet/ccc?key=18DpYlL7ey3OTbXnTeDl82wD4ISq6iU2Gv5wCQjJsMuQ#gid=295788079'
```

#### Example 3
```coffeescript
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
      # for this entry the options will be a copy of above one and extended by its own set below
      options:
        prettifyJson: false
        typeMapping:
          col1: 'number'
  ]
```


## Release History

 * 2014-07-19   v0.5.0   Add type conversion callback. Remove 2d array support.
 * 2014-07-14   v0.4.6   Fetch key & gid from new gss urls, dump more useful log
 * 2014-03-26   v0.4.5   Fix one more bug about deep copy
 * 2014-03-26   v0.4.4   Switch to $.extend for deep copy
 * 2014-03-26   v0.4.3   Fix manual array mapping
 * 2014-03-07   v0.4.2   Add type boolean
 * 2014-02-25   v0.4.1   Add type undefined
 * 2014-02-25   v0.4.0   Add files object array to support options per file
 * 2014-02-04   v0.3.0   Add typeMapping, new option to enforce field type
 * 2014-01-31   v0.2.0   Implement save json, and update options
 * 2014-01-29   v0.1.0   Initial release
