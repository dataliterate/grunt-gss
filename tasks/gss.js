module.exports = function(grunt) {
  var OAuth2Client, Promise, all, boolRx, convertFields, csv2json, done, extend, floatRx, getAccessToken, getClient, getFile, getSheet, googleapis, http, intRx, keyAndGidRx, open, querystring, request, toType, trueRx, _files, _oauth2clients, _sheets;
  all = require('node-promise').all;
  csv2json = require('./lib/csv2json');
  done = void 0;
  extend = require('extend');
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
      grunt.verbose.write('cached:');
    } else {
      oauth2client = _oauth2clients["" + clientId + clientSecret] || new OAuth2Client(clientId, clientSecret, redirectUri);
      getFile(fileId, oauth2client).then(function(file) {
        var opts, params, root;
        grunt.verbose.write('getFile...');
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
          _oauth2clients["" + oauth2client.clientId_ + "" + oauth2client.clientSecret_] = oauth2client;
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
      grunt.verbose.write('cached:');
    } else {
      getClient('drive', 'v2', oauth2client).then(function(client) {
        grunt.verbose.write('getClient...');
        return client.drive.files.get({
          fileId: fileId
        }).execute(function(err, file) {
          if (err) {
            grunt.log.error(done(false) || ("googleapis: " + (err.message || err)));
          }
          return promise.resolve(_files[fileId] = file);
        });
      });
    }
    return promise;
  };
  getClient = function(name, version, oauth2client) {
    var get, promise;
    promise = new Promise();
    get = function(err, client) {
      grunt.verbose.write('getAccessToken...');
      if (err) {
        grunt.log.error(done(false) || ("googleapis: " + (err.message || err)));
      }
      return promise.resolve(client);
    };
    if (oauth2client) {
      getAccessToken(oauth2client).then(function() {
        return googleapis.discover(name, version).withAuthClient(oauth2client).execute(get);
      });
    } else {
      googleapis.discover(name, version).execute(get);
      grunt.verbose.write('cached:');
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
      resp.end();
      req.connection.destroy();
      server.close();
      return oauth2client.getToken(code, function(err, tokens) {
        if (err) {
          grunt.log.error(done(false) || ("googleapis: " + (err.message || err)));
        }
        oauth2client.setCredentials(tokens);
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
  keyAndGidRx = /^.*[\/\=]([0-9a-zA-Z]{44})[\/#].*gid=(\d+).*$/;
  grunt.registerMultiTask('gss', function() {
    var dest, file, files, k, m, next, src, _ref, _ref1;
    files = [];
    grunt.log.write('Parsing file entries...');
    if (toType(this.data.files) === 'object') {
      _ref = this.data.files;
      for (dest in _ref) {
        src = _ref[dest];
        files.push({
          dest: dest,
          gid: (m = src.match(keyAndGidRx))[2],
          key: m[1],
          src: src,
          opts: this.data.options || {}
        });
      }
    } else {
      _ref1 = this.data.files;
      for (k in _ref1) {
        file = _ref1[k];
        if (typeof file.src !== 'string') {
          file.src = file.src[0];
        }
        files.push({
          dest: file.dest,
          gid: (m = file.src.match(keyAndGidRx))[2],
          key: m[1],
          src: file.src,
          opts: extend(file.options, this.data.options || {})
        });
      }
    }
    grunt.log.debug(JSON.stringify(files));
    grunt.log.ok();
    done = this.async();
    return (next = function(f) {
      grunt.log.write("Saving " + f.dest + "...");
      return getSheet(f.key, f.gid, f.opts.clientId, f.opts.clientSecret, 'http://localhost:4477/').then(function(r) {
        var arr;
        grunt.verbose.write('getSheet...');
        grunt.log.debug("" + (JSON.stringify(r.body)) + "...");
        if (!r.body) {
          grunt.log.error('empty');
        } else if (!f.opts.saveJson) {
          grunt.file.write(f.dest, r.body);
        } else {
          grunt.log.write('csv2json...');
          arr = JSON.parse(csv2json(r.body));
          if (f.opts.typeDetection) {
            grunt.log.write('detect...');
            convertFields(arr);
          }
          if (f.opts.typeMapping) {
            grunt.log.write('map...');
            convertFields(arr, f.opts.typeMapping);
          }
          if (f.opts.prettifyJson) {
            grunt.log.write('prettify...');
            grunt.file.write(f.dest, JSON.stringify(arr, null, 2));
          } else {
            grunt.file.write(f.dest, JSON.stringify(arr));
          }
        }
        grunt.log.ok();
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
