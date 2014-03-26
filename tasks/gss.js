module.exports = function(grunt) {
  var OAuth2Client, Promise, all, boolRx, convertFields, csv2json, done, extend, floatRx, getAccessToken, getClient, getFile, getSheet, googleapis, http, intRx, keyAndGidRx, open, querystring, request, toType, trueRx, _files, _oauth2clients, _sheets;
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
  _oauth2clients = {};
  getSheet = function(fileId, sheetId, clientId, clientSecret, redirectUri) {
    var oauth2client, promise, sheet;
    promise = new Promise();
    if (sheet = _sheets["" + fileId + sheetId]) {
      promise.resolve(sheet);
      grunt.log.writeln('getSheet: ok');
    } else {
      oauth2client = _oauth2clients["" + clientId + clientSecret] || new OAuth2Client(clientId, clientSecret, redirectUri);
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
          _oauth2clients["" + oauth2client.clientId_ + oauth2client.clientSecret_] = oauth2client;
          return promise.resolve(_sheets["" + fileId + sheetId] = resp);
        });
      });
    }
    return promise;
  };
  _files = {};
  getFile = function(fileId, oauth2client) {
    var file, promise;
    promise = new Promise();
    if (file = _files[fileId]) {
      promise.resolve(file);
    } else {
      getClient('drive', 'v2', oauth2client).then(function(client) {
        return client.drive.files.get({
          fileId: fileId
        }).execute(function(err, file) {
          if (err) {
            grunt.log.error(done(false) || ("googleapis: " + (err.message || err)));
          }
          grunt.log.writeln('getFile: ok');
          return promise.resolve(_files[fileId] = file);
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
  boolRx = /^(true|false)$/i;
  floatRx = /^\d+\.\d+$/i;
  intRx = /^\d+$/i;
  trueRx = /^true$/i;
  convertFields = function(arr, mapping) {
    var el, el1, field, fields, key, lv1, lv2, pos, type, types, val, _i, _j, _k, _l, _len, _len1, _len2, _len3;
    if (!mapping) {
      for (_i = 0, _len = arr.length; _i < _len; _i++) {
        el = arr[_i];
        for (key in el) {
          val = el[key];
          if (boolRx.test(val)) {
            el[key] = trueRx.test(val);
          } else if (floatRx.test(val)) {
            el[key] = parseFloat(val);
          } else if (intRx.test(val)) {
            el[key] = parseInt(val);
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
    } else {
      fields = [];
      types = [];
      for (field in mapping) {
        type = mapping[field];
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
                if (val.indexOf(',') !== -1) {
                  if (val.indexOf('|') !== -1) {
                    lv1 = val.split('|');
                    lv2 = [];
                    for (_l = 0, _len3 = lv1.length; _l < _len3; _l++) {
                      el1 = lv1[_l];
                      lv2.push(el1.split(','));
                    }
                    el[key] = lv2;
                  } else {
                    el[key] = val.split(',');
                  }
                } else {
                  el[key] = val ? [val] : [];
                }
              } else if (type === 'boolean') {
                el[key] = trueRx.test(val);
              } else if (type === 'number') {
                el[key] = parseFloat(val || 0);
              } else if (type === 'string') {
                el[key] = val.toString();
              } else if (type === 'undefined') {
                delete el[key];
              }
            }
          }
        }
      }
    }
    return null;
  };
  keyAndGidRx = /^.*key=([^#&]+).*gid=([^&]+).*$/;
  grunt.registerMultiTask('gss', function() {
    var dest, file, files, k, next, opts, src, _ref, _ref1;
    done = this.async();
    opts = this.data.options || {};
    files = [];
    if (toType(this.data.files) === 'object') {
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
        extend(file, JSON.parse(file.src[0].replace(keyAndGidRx, '{"key":"$1","gid":"$2"}')));
        if (file.options) {
          file.opts = extend(true, extend({}, opts), file.options);
          delete file.options;
        } else {
          file.opts = opts;
        }
        files.push(file);
      }
    }
    return (next = function(file) {
      return getSheet(file.key, file.gid, opts.clientId, opts.clientSecret, 'http://localhost:4477/').then(function(resp) {
        var arr;
        if (!file.opts.saveJson) {
          grunt.file.write(file.dest, resp.body);
        } else {
          arr = JSON.parse(csv2json(resp.body));
          if (file.opts.typeDetection) {
            convertFields(arr);
          }
          if (file.opts.typeMapping) {
            convertFields(arr, file.opts.typeMapping);
          }
          if (file.opts.prettifyJson) {
            grunt.file.write(file.dest, JSON.stringify(arr, null, 2));
          } else {
            grunt.file.write(file.dest, JSON.stringify(arr));
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
