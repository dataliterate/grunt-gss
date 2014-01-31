module.exports = function(grunt) {
  var OAuth2Client, Promise, all, censor, csv2json, done, floatRx, getAccessToken, getClient, getFile, getSheet, googleapis, http, intRx, open, querystring, request, stKeyAndGidRx, _files;
  all = require('node-promise').all;
  csv2json = require('./lib/csv2json');
  done = void 0;
  googleapis = require('googleapis');
  http = require('http');
  open = require('open');
  querystring = require('querystring');
  request = require('request');
  OAuth2Client = googleapis.OAuth2Client;
  Promise = require('node-promise').Promise;
  getSheet = function(fileId, sheetId, oauth2client) {
    var promise;
    promise = new Promise();
    getFile(fileId, oauth2client).then(function(file) {
      var opts, params, root;
      root = 'https://docs.google.com/feeds/download/spreadsheets/Export';
      params = {
        key: file.id,
        exportFormat: 'csv',
        gid: sheetId
      };
      opts = {
        uri: "" + root + "?" + (querystring.stringify(params)),
        headers: {
          Authorization: "Bearer " + oauth2client.credentials.access_token
        }
      };
      return request(opts, function(err, resp) {
        if (err) {
          grunt.log.error(done(false) || ("googleapis: " + (err.message || err)));
        }
        grunt.log.writeln('getSheet: ok');
        return promise.resolve(resp);
      });
    });
    return promise;
  };
  _files = {};
  getFile = function(fileId, oauth2client) {
    var promise;
    promise = new Promise();
    if (_files[fileId]) {
      promise.resolve(_files[fileId]);
    } else {
      getClient('drive', 'v2', oauth2client).then(function(client) {
        return client.drive.files.get({
          fileId: fileId
        }).execute(function(err, file) {
          if (err) {
            grunt.log.error(done(false) || ("googleapis: " + (err.message || err)));
          }
          grunt.log.writeln('getFile: ok');
          _files[fileId] = file;
          return promise.resolve(file);
        });
      });
    }
    return promise;
  };
  getClient = function(client, version, oauth2client) {
    var get, promise;
    promise = new Promise();
    get = function(err, client) {
      if (err) {
        grunt.log.error(done(false) || ("googleapis: " + (err.message || err)));
      }
      grunt.log.writeln('getClient: ok');
      return promise.resolve(client);
    };
    if (oauth2client) {
      getAccessToken(oauth2client).then(function() {
        return googleapis.discover(client, version).withAuthClient(oauth2client).execute(get);
      });
    } else {
      googleapis.discover(client, version).execute(get);
    }
    return promise;
  };
  getAccessToken = function(oauth2client) {
    var promise, server, url;
    promise = new Promise();
    url = oauth2client.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/drive.readonly'
    });
    open(url);
    server = http.createServer(function(req, resp) {
      var code;
      code = req.url.substr(7);
      resp.write('<html><script>open(location,"_self").close()</script></html>');
      resp.end();
      req.connection.destroy();
      server.close();
      return oauth2client.getToken(code, function(err, tokens) {
        if (err) {
          grunt.log.error(done(false) || ("googleapis: " + (err.message || err)));
        }
        oauth2client.setCredentials(tokens);
        grunt.log.writeln('getAccessToken: ok');
        return promise.resolve();
      });
    }).listen(4477);
    return promise;
  };
  intRx = /^\d+$/i;
  floatRx = /^\d+\.\d+$/i;
  censor = function(key, val) {
    if (typeof val === 'object') {
      return val;
    } else if (intRx.test(val)) {
      return parseInt(val);
    } else if (floatRx.test(val)) {
      return parseFloat(val);
    } else if (val.indexOf(',') !== -1) {
      return val.split(',');
    } else {
      return val;
    }
  };
  stKeyAndGidRx = /^.*key=([^#&]+).*gid=([^&]+).*$/;
  grunt.registerMultiTask('gss', function() {
    var file, files, link, next, oauth2client, opts, path, _ref;
    done = this.async();
    opts = this.data.options;
    files = [];
    _ref = this.data.files;
    for (path in _ref) {
      link = _ref[path];
      file = JSON.parse(link.replace(stKeyAndGidRx, '{"key":"$1","gid":"$2"}'));
      file.path = path;
      files.push(file);
    }
    oauth2client = new OAuth2Client(opts.clientId, opts.clientSecret, 'http://localhost:4477/');
    return (next = function(file) {
      return getSheet(file.key, file.gid, oauth2client).then(function(resp) {
        if (resp.body.length) {
          if (!opts.saveJson) {
            grunt.file.write(file.path, resp.body);
          } else if (!opts.prettifyJson) {
            grunt.file.write(file.path, csv2json(resp.body));
          } else if (!opts.typeDetection) {
            grunt.file.write(file.path, JSON.stringify(JSON.parse(csv2json(resp.body)), void 0, 2));
          } else {
            grunt.file.write(file.path, JSON.stringify(JSON.parse(csv2json(resp.body)), censor, 2));
          }
        }
        if (files.length) {
          return next(files.shift());
        } else {
          return done(true);
        }
      });
    }).call(this, files.shift());
  });
  return null;
};
