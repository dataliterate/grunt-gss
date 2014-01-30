# grunt-gss v0.1.0

> Exports Google Spreadsheets that you have access to.


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
    spreadsheet1: {
      options: {
        // your Google API key
        clientId: '785010223027.apps.googleusercontent.com',
        clientSecret: 'nwQ2UedRysgbNZl6jE3I77Ji',
        // the key in the link to your spreadsheet
        key: '0AmPyOqJNrt_SdGlZOVlrc2UzS3FpV1V6Ri1jX0haSlE'
      },
      files: {
        // local path : gid of target worksheet
        'Sheet1.csv': 0,
        'Sheet2.csv': 1
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

### TODO
1. Save also in JSON
2. Data type detection
3. Prettify


## Release History

 * 2014-01-29   v0.1.0   initial release
