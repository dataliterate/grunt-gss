# grunt-gss v0.2.2

> Save your Google Spreadsheets locally as CSV or JSON.


## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-contrib-gss --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-contrib-gss');
```

### Overview
Google Spreadsheet could be a simple yet powerful front end for average users to preform management to loads of JSON files.

Trying to make it a task for CouchApps.

### The Task
```javascript
grunt.initConfig({
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
        typeDetection: true // parseInt, parseFloat, or split(',')
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
        'Sheet2.csv': 'https://docs.google.com/spreadsheet/ccc?key=0AmPyOqJNrt_SdGlZOVlrc2UzS3FpV1V6Ri1jX0haSlE#gid=1'
      }
    }
  }
});
```

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


## Release History

 * 2014-01-31   v0.2.0   implement save json, and update options
 * 2014-01-29   v0.1.0   initial release
