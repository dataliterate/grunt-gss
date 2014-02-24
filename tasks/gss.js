module.exports = function(grunt) {
  var OAuth2Client, Promise, all, csv2json, done, extend, floatRx, getAccessToken, getClient, getFile, getSheet, googleapis, http, intRx, keyAndGidRx, open, querystring, request, toType, _files, _sheets;
  all = require('node-promise').all;
  csv2json = require('./lib/csv2json');
  done = void 0;
  extend = require('./lib/extend');
  googleapis = require('googleapis');
  http = require('http');
  open = require('open');
  querystring = require('querystring');
  request = require('request');
  OAuth2Client = googleapis.OAuth2Client;
  Promise = require('node-promise').Promise;
  toType = function(obj) {
    return {}.toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
  };
  _sheets = {};
  getSheet = function(fileId, sheetId, oauth2client) {
    var promise;
    promise = new Promise();
    if (_sheets[fileId] && _sheets[fileId][sheetId]) {
      setTimeout(promise.resolve(_sheets[fileId][sheetId]), 1);
      grunt.log.writeln('getSheet: ok');
    } else {
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
          if (!_sheets[fileId]) {
            _sheets[fileId] = {};
          }
          _sheets[fileId][sheetId] = resp;
          return promise.resolve(resp);
        });
      });
    }
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
  keyAndGidRx = /^.*key=([^#&]+).*gid=([^&]+).*$/;
  grunt.registerMultiTask('gss', function() {
    var dest, file, files, k, next, oauth2client, opts, src, _ref, _ref1;
    done = this.async();
    opts = this.data.options || {};
    files = [];
    if (toType(this.data.files === 'array')) {
      _ref = this.data.files;
      for (dest in _ref) {
        src = _ref[dest];
        file = JSON.parse(src.replace(keyAndGidRx, '{"key":"$1","gid":"$2"}'));
        file.src = src;
        file.dest = dest;
        file.opts = opts;
        files.push(file);
      }
    } else {
      _ref1 = this.data.files;
      for (k in _ref1) {
        file = _ref1[k];
        extend(file, JSON.parse(file.src.replace(keyAndGidRx, '{"key":"$1","gid":"$2"}')));
        if (file.options) {
          file.opts = extend(extend({}, opts), file.options);
          delete file.options;
        } else {
          file.opts = opts;
        }
        files.push(file);
      }
    }
    oauth2client = new OAuth2Client(opts.clientId, opts.clientSecret, 'http://localhost:4477/');
    return (next = function(file) {
      return getSheet(file.key, file.gid, oauth2client).then(function(resp) {
        var arr, arrStr, el, el1, field, fields, key, lv1, lv2, pos, type, types, val, _i, _j, _k, _len, _len1, _len2, _ref2;
        if (resp.body.length) {
          if (file.opts.saveJson) {
            arrStr = csv2json(resp.body);
            if (file.opts.prettifyJson) {
              arr = JSON.parse(arrStr);
              if (file.opts.typeDetection) {
                for (_i = 0, _len = arr.length; _i < _len; _i++) {
                  el = arr[_i];
                  for (key in el) {
                    val = el[key];
                    if (intRx.test(val)) {
                      el[key] = parseInt(val);
                    } else if (floatRx.test(val)) {
                      el[key] = parseFloat(val);
                    } else if (val.indexOf(',') !== -1) {
                      if (val.indexOf('|') !== -1) {
                        lv1 = val.split('|');
                        lv2 = [];
                        for (_j = 0, _len1 = lv1.length; _j < _len1; _j++) {
                          el1 = lv1[_j];
                          lv2.push(el1.split(','));
                        }
                        el[key] = lv2;
                      } else {
                        el[key] = val.split(',');
                      }
                    }
                  }
                }
              }
              if (file.opts.typeMapping) {
                fields = [];
                types = [];
                _ref2 = file.opts.typeMapping;
                for (field in _ref2) {
                  type = _ref2[field];
                  fields.push(field);
                  types.push(type);
                }
                for (_k = 0, _len2 = arr.length; _k < _len2; _k++) {
                  el = arr[_k];
                  for (key in el) {
                    val = el[key];
                    if ((pos = fields.indexOf(key)) !== -1) {
                      if (toType(val) !== (type = types[pos])) {
                        if (type === 'array') {
                          el[key] = val ? [val] : [];
                        } else if (type === 'string') {
                          el[key] = val.toString();
                        } else if (type === 'number') {
                          el[key] = parseFloat(val || 0);
                        }
                      }
                    }
                  }
                }
              }
              grunt.file.write(file.dest, JSON.stringify(arr, null, 2));
            } else {
              grunt.file.write(file.dest, arrStr);
            }
          } else {
            grunt.file.write(file.dest, resp.body);
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
