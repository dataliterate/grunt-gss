module.exports = (grunt) ->

  all = require('node-promise').all
  csv2json = require './lib/csv2json'
  done = undefined
  googleapis = require 'googleapis'
  http = require 'http'
  open = require 'open'
  querystring = require 'querystring'
  request = require 'request'
  OAuth2Client = googleapis.OAuth2Client
  Promise = require('node-promise').Promise

  getSheet = (fileId, sheetId, oauth2client) ->
    promise = new Promise()
    getFile(fileId, oauth2client).then (file) ->
      root = 'https://docs.google.com/feeds/download/spreadsheets/Export'
      params = key: file.id, exportFormat: 'csv', gid: sheetId
      opts =
        uri: "#{root}?#{querystring.stringify params}"
        headers: Authorization: "Bearer #{oauth2client.credentials.access_token}"
      request opts, (err, resp) ->
        if err then grunt.log.error done(false) or "googleapis: #{err.message or err}"
        grunt.log.writeln 'getSheet: ok'
        promise.resolve resp
    promise

  _files = {}
  getFile = (fileId, oauth2client) ->
    promise = new Promise()
    if _files[fileId] then promise.resolve _files[fileId]
    else getClient('drive', 'v2', oauth2client).then (client) ->
      client.drive.files.get({fileId}).execute (err, file) ->
        if err then grunt.log.error done(false) or "googleapis: #{err.message or err}"
        grunt.log.writeln 'getFile: ok'
        _files[fileId] = file
        promise.resolve file
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

  intRx = /^\d+$/i
  floatRx = /^\d+\.\d+$/i
  keyAndGidRx = /^.*key=([^#&]+).*gid=([^&]+).*$/
  grunt.registerMultiTask 'gss', ->
    done = @async()
    opts = @data.options
    files = []
    for path, link of @data.files
      file = JSON.parse link.replace keyAndGidRx, '{"key":"$1","gid":"$2"}'
      file.path = path
      files.push file
    oauth2client = new OAuth2Client opts.clientId, opts.clientSecret, 'http://localhost:4477/'

    # sync, could be implt as async after token is retrieved
    (next = (file) ->
      getSheet(file.key, file.gid, oauth2client).then (resp) ->
        if resp.body.length
          if opts.saveJson
            arrStr = csv2json resp.body
            if opts.prettifyJson
              arr = JSON.parse arrStr
              # auto json field type
              if opts.typeDetection
                for el in arr
                  for key, val of el
                    if intRx.test val then el[key] = parseInt val
                    else if floatRx.test val then el[key] = parseFloat val
                    else if val.indexOf(',') isnt -1 then el[key] = val.split ','
              # save pretty json array
              grunt.file.write file.path, JSON.stringify arr, null, 2
            # save raw json array
            else grunt.file.write file.path, arrStr
          # save csv
          else grunt.file.write file.path, resp.body
        if files.length then next files.shift()
        else done true
    ).call @, files.shift()

  null
