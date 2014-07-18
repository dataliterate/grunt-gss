module.exports = (grunt) ->

  all = require('node-promise').all
  csv2json = require './lib/csv2json'
  done = undefined
  extend = require 'extend'
  googleapis = require 'googleapis'
  http = require 'http'
  open = require 'open'
  querystring = require 'querystring'
  request = require 'request'
  OAuth2Client = googleapis.OAuth2Client
  Promise = require('node-promise').Promise
  toType = (obj) ->
    ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()

  _sheets = {}
  _oauth2clients = {}
  getSheet = (fileId, sheetId, clientId, clientSecret, redirectUri) ->
    promise = new Promise()
    if sheet = _sheets["#{fileId}#{sheetId}"]
      promise.resolve sheet
      grunt.verbose.write 'cached:'
    else
      oauth2client = _oauth2clients["#{clientId}#{clientSecret}"] or
        new OAuth2Client clientId, clientSecret, redirectUri
      getFile(fileId, oauth2client).then (file) ->
        grunt.verbose.write 'getFile...'
        root = 'https://docs.google.com/feeds/download/spreadsheets/Export'
        params = key: file.id, exportFormat: 'csv', gid: sheetId
        opts =
          uri: "#{root}?#{querystring.stringify params}"
          headers: Authorization:
            "Bearer #{oauth2client.credentials.access_token}"
        request opts, (err, resp) ->
          if err then grunt.log.error done(false) or
          "googleapis: #{err.message or err}"
          _oauth2clients["#{oauth2client.clientId_}\
          #{oauth2client.clientSecret_}"] = oauth2client
          promise.resolve _sheets["#{fileId}#{sheetId}"] = resp
    promise

  _files = {}
  getFile = (fileId, oauth2client) ->
    promise = new Promise()
    if file = _files[fileId]
      promise.resolve file
      grunt.verbose.write 'cached:'
    else getClient('drive', 'v2', oauth2client).then (client) ->
      grunt.verbose.write 'getClient...'
      client.drive.files.get({fileId}).execute (err, file) ->
        if err then grunt.log.error done(false) or
        "googleapis: #{err.message or err}"
        promise.resolve _files[fileId] = file
    promise

  getClient = (name, version, oauth2client) ->
    promise = new Promise()
    get = (err, client) ->
      grunt.verbose.write 'getAccessToken...'
      if err then grunt.log.error done(false) or
      "googleapis: #{err.message or err}"
      promise.resolve client
    if oauth2client
      getAccessToken(oauth2client).then ->
        googleapis.discover(name, version)
        .withAuthClient(oauth2client).execute get
    else
      googleapis.discover(name, version).execute get
      grunt.verbose.write 'cached:'
    promise

  getAccessToken = (oauth2client) ->
    promise = new Promise()
    url = oauth2client.generateAuthUrl
      access_type: 'offline'
      scope: 'https://www.googleapis.com/auth/drive.readonly'
    open url
    server = http.createServer (req, resp) ->
      code = req.url.substr 7
      resp.end()
      req.connection.destroy()
      server.close()
      oauth2client.getToken code, (err, tokens) ->
        if err then grunt.log.error done(false) or
        "googleapis: #{err.message or err}"
        oauth2client.setCredentials tokens
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
          else if val.indexOf(',') isnt -1 then el[key] = val.split ','
    # manual
    else
      fields = []
      types = []
      for field, type of mapping
        fields.push field
        types.push type
      for el in arr
        for key, val of el
          if (pos = fields.indexOf key) isnt -1 # if force type found
            if toType(val) isnt type = types[pos] # and override is needed
              if type is 'array'
                if val.indexOf(',') isnt -1 then el[key] = val.split ','
                else el[key] = if val then [val] else []
              else if type is 'boolean' then el[key] = trueRx.test val
              else if type is 'number' then el[key] = parseFloat val or 0
              else if type is 'string' then el[key] = val.toString()
              else if type is 'undefined' then delete el[key]
    null

  # the task
  keyAndGidRx = /^.*[\/\=]([0-9a-zA-Z]{44})[\/#].*gid=(\d+).*$/
  grunt.registerMultiTask 'gss', ->

    # parse file items
    # [{dest:string, gid:string, key:string, src:string, opts:object}]
    files = []
    grunt.log.write 'Parsing file entries...'
    if toType(@data.files) is 'object'
      for dest, src of @data.files
        files.push
          dest: dest, gid: (m = src.match keyAndGidRx)[2], key: m[1],
          src: src, opts: @data.options or {}
    else # object array
      for k, file of @data.files
        # TODO support file.expand, concat multiple sheets
        file.src = file.src[0] if typeof file.src isnt 'string'
        files.push
          dest: file.dest, gid: (m = file.src.match keyAndGidRx)[2], key: m[1],
          src: file.src, opts: extend file.options, @data.options or {}
    grunt.log.debug JSON.stringify files
    grunt.log.ok()

    # loop and save files
    done = @async()
    (next = (f) ->
      grunt.log.write "Saving #{f.dest}..."
      getSheet(f.key, f.gid, f.opts.clientId,
      f.opts.clientSecret, 'http://localhost:4477/').then (r) ->
        grunt.verbose.write 'getSheet...'
        grunt.log.debug "#{JSON.stringify r.body}..."
        if not r.body then grunt.log.error 'empty'
        else if not f.opts.saveJson then grunt.file.write f.dest, r.body
        else
          grunt.log.write 'csv2json...'
          arr = JSON.parse csv2json r.body
          if f.opts.typeDetection
            grunt.log.write 'detect...'
            convertFields arr
          if f.opts.typeMapping
            grunt.log.write 'map...'
            convertFields arr, f.opts.typeMapping
          if f.opts.prettifyJson
            grunt.log.write 'prettify...'
            grunt.file.write f.dest, JSON.stringify arr, null, 2
          else grunt.file.write f.dest, JSON.stringify arr
        grunt.log.ok()
        # continue
        if files.length then next files.shift()
        else done true
    ).call @, files.shift()

  null
