express = require('express')
redis   = require('redis')
io      = require('socket.io')
_ = require('underscore')
commands = require('./commands')

redis_client = redis.createClient()

redis_client.on 'error', (error) ->
  console.log error

app = express.createServer()
app.use(express.static(__dirname))
app.use(express.logger({ 'format': ':method :url' })) #'

app.listen(3000)
console.log('listening on :3000')

socket = io.listen(app)

# map the command to the type of data it'll return
reply_types =
  'KEYS': 'key'
  'GET': 'string'
  'HGETALL': 'hash'
  'DEL': 'string'
  'SET': 'string'
  'HSET': 'string'
  
command_map =
  'string': 'GET'
  'hash': 'HGETALL'
  
format_json = (data, indent = '') ->
  return data if _.isNumber(data)
  
  new_indent = '  '

  is_array = _.isArray(data)
  
  if is_array
    if data.length is 0
      return '[]'
    else
      closing_brace = ']'
      html = '['
  else
    if _.size(data) is 0
      return '{}'
    else
      closing_brace = '}'
      html = '{'

  i = 0

  _.each data, (val, key) ->
    html += ', ' if i > 0

    if is_array
      html += '\n' + indent + new_indent
    else
      html += '\n' + indent + new_indent + '<strong>\"' + key + '\":</strong> '

    switch typeof val
      when 'object'
        html += format_json(val, indent + new_indent)
      when 'string'
        html += '\"' + JSON.stringify(val).replace(/^"|"$/g, '').replace(/'/g, "\\'").replace(/\\"/g, '"') + '\"'
      when 'number'
        html += JSON.stringify(val)
      when 'boolean'
        html += JSON.stringify(val)
      else
        html += '\"' + JSON.stringify(val) + '\"'

    i++

  html += '\n' + indent + closing_brace

  return html

socket.on 'connection', (client) ->

  client.on 'message', (message) ->
    args = message.match(/(["'])(?:\\\1|.)*?\1|\S+/g) #"
    command = args.shift().toUpperCase()
    
    args = _.map args, (arg) ->
      return arg.replace(/^(["'])(.*?)\1$/g, '$2') #"

    return if not command of commands

    redis_client[command] args, (error, reply) ->
      reply_type = reply_types[command]
      
      if command is 'KEYS'
        _.each reply, (key) ->
          redis_client.TYPE key, (error, type) ->
            client.send
              reply: key
              type: type
              command: command_map[type]
              reply_type: reply_type
          return
      else
        if reply_type is 'string'
          try
            json_reply = JSON.parse(reply)
            reply = format_json(json_reply)

        client.send
          reply: reply
          reply_type: reply_type or 'string'

    return
  return
