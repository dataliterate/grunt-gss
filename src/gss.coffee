module.exports = (grunt) ->

  all = require('node-promise').all
  csv2json = require './lib/csv2json'
  done = undefined
  extend = require './lib/extend'
  googleapis = require 'googleapis'
  http = require 'http'
  open = require 'open'
  querystring = require 'querystring'
  request = require 'request'
  OAuth2Client = googleapis.OAuth2Client
  Promise = require('node-promise').Promise
  toType = (obj) -> ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()

  _sheets = {}
  _oauth2clients = {}
  getSheet = (fileId, sheetId, clientId, clientSecret, redirectUri) ->
    promise = new Promise()
    if sheet = _sheets["#{fileId}#{sheetId}"]
      promise.resolve sheet
      grunt.log.writeln 'getSheet: ok'
    else
      oauth2client = _oauth2clients["#{clientId}#{clientSecret}"] or
        new OAuth2Client clientId, clientSecret, redirectUri
      getFile(fileId, oauth2client).then (file) ->
        root = 'https://docs.google.com/feeds/download/spreadsheets/Export'
        params = key: file.id, exportFormat: 'csv', gid: sheetId
        opts =
          uri: "#{root}?#{querystring.stringify params}"
          headers: Authorization: "Bearer #{oauth2client.credentials.access_token}"
        request opts, (err, resp) ->
          if err then grunt.log.error done(false) or "googleapis: #{err.message or err}"
          grunt.log.writeln 'getSheet: ok'
          _oauth2clients["#{oauth2client.clientId_}#{oauth2client.clientSecret_}"] = oauth2client
          promise.resolve _sheets["#{fileId}#{sheetId}"] = resp
    promise

  _files = {}
  getFile = (fileId, oauth2client) ->
    promise = new Promise()
    if file = _files[fileId] then promise.resolve file
    else getClient('drive', 'v2', oauth2client).then (client) ->
      client.drive.files.get({fileId}).execute (err, file) ->
        if err then grunt.log.error done(false) or "googleapis: #{err.message or err}"
        grunt.log.writeln 'getFile: ok'
        promise.resolve _files[fileId] = file
    promise

  getClient = (client, version, oauth2client) ->
    promise = new Promise()
    get = (err, client) ->
      if err then grunt.log.error done(false) or "googleapis: #{err.message or err}"
      grunt.log.writeln 'getClient: ok'
      promise.resolve client
    if oauth2client
      getAccessToken(oauth2client).then ->
        googleapis.discover(client, version).withAuthClient(oauth2client).execute get
    else googleapis.discover(client, version).execute get
    promise

  getAccessToken = (oauth2client) ->
    promise = new Promise()
    url = oauth2client.generateAuthUrl
      access_type: 'offline'
      scope: 'https://www.googleapis.com/auth/drive.readonly'
    open url
    server = http.createServer (req, resp) ->
      code = req.url.substr 7
      # works only on chrome
      resp.write '<html><script>open(location,"_self").close()</script></html>'
      resp.end()
      req.connection.destroy()
      server.close()
      oauth2client.getToken code, (err, tokens) ->
        if err then grunt.log.error done(false) or "googleapis: #{err.message or err}"
        oauth2client.setCredentials tokens
        grunt.log.writeln 'getAccessToken: ok'
        promise.resolve()
    .listen 4477 # ggss
    promise

  boolRx = /^(true|false)$/i
  floatRx = /^\d+\.\d+$/i
  intRx = /^\d+$/i
  trueRx = /^true$/i
  convertFields = (arr, mapping) ->
    # auto
    if not mapping
      for el in arr
        for key, val of el
          if boolRx.test val then el[key] = trueRx.test val
          else if floatRx.test val then el[key] = parseFloat val
          else if intRx.test val then el[key] = parseInt val
          else if val.indexOf(',') isnt -1
            # comma become second delimiter if pipe exists
            if val.indexOf('|') isnt -1
              lv1 = val.split '|'
              lv2 = []
              lv2.push el1.split ',' for el1 in lv1
              el[key] = lv2
            else el[key] = val.split ','
    # manual
    else
      fields = []
      types = []
      for field, type of mapping
        fields.push field
        types.push type
      for el in arr
        for key, val of el
          if (pos = fields.indexOf key) isnt -1
            if toType(val) isnt type = types[pos]
              if type is 'array'
                if val.indexOf(',') isnt -1
                  # comma become second delimiter if pipe exists
                  if val.indexOf('|') isnt -1
                    lv1 = val.split '|'
                    lv2 = []
                    lv2.push el1.split ',' for el1 in lv1
                    el[key] = lv2
                  else el[key] = val.split ','
                else el[key] = if val then [val] else []
              else if type is 'boolean' then el[key] = trueRx.test val
              else if type is 'number' then el[key] = parseFloat val or 0
              else if type is 'string' then el[key] = val.toString()
              else if type is 'undefined' then delete el[key]
    null

  # the task
  keyAndGidRx = /^.*key=([^#&]+).*gid=([^&]+).*$/
  grunt.registerMultiTask 'gss', ->
    done = @async()
    opts = @data.options or {}

    # prepare files, [{key:string, gid:string, src:string, dest:string, opts:object}]
    files = []
    if toType(@data.files) is 'object'
      for dest, src of @data.files
        file = JSON.parse src.replace keyAndGidRx, '{"key":"$1","gid":"$2"}'
        file.src = src
        file.dest = dest
        file.opts = opts
        files.push file
    else # object array
      for k, file of @data.files
        # file.src string is somehow being converted to an array
        extend file, JSON.parse file.src[0].replace keyAndGidRx, '{"key":"$1","gid":"$2"}'
        if file.options
          file.opts = extend true, extend({}, opts), file.options
          delete file.options
        else file.opts = opts
        files.push file

    # loop and save files, could be implt as async after token is retrieved
    (next = (file) ->
      getSheet(file.key, file.gid, opts.clientId, opts.clientSecret, 'http://localhost:4477/').then (resp) ->
        # save csv
        if not file.opts.saveJson then grunt.file.write file.dest, resp.body
        # save json
        else
          arr = JSON.parse csv2json resp.body
          if file.opts.typeDetection then convertFields arr
          if file.opts.typeMapping then convertFields arr, file.opts.typeMapping
          # prettify
          if file.opts.prettifyJson
            grunt.file.write file.dest, JSON.stringify arr, null, 2
          else grunt.file.write file.dest, JSON.stringify arr
        # continue
        if files.length then next files.shift()
        else done true
    ).call @, files.shift()

  null
