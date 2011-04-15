express = require('express')
redis   = require('redis')
io      = require('socket.io')
_ = require('underscore')
commands = require('./commands')
format_json = require('./format_json')

_.each commands, (val, key) ->
  console.log key

redis.debug_mode = true
redis_client = redis.createClient()

redis_client.on 'error', (error) ->
  console.log error
  return

app = express.createServer()
app.use(express.static(__dirname))
app.use(express.logger({ 'format': ':method :url' })) #'

app.listen(3000)
console.log('listening on :3000')

socket = io.listen(app)

# map the command to the type of data it'll return
reply_types =
  'KEYS': 'keys'
  'HGETALL': 'hash'
  'LRANGE': 'list'
  'SMEMBERS': 'set'
  'ZRANGE': 'zset'
  'ZADD': 'integer'
  
key_command_map =
  'string': 'GET'
  'hash': 'HGETALL'
  'list': 'LRANGE'
  'set': 'SMEMBERS'
  'zset': 'ZRANGE'
  
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
              title: message
              command: key_command_map[type]
              reply_type: reply_type
          return
      else
        if reply_type is 'string'
          try
            reply = format_json(reply)
        if reply_type is 'hash' or reply_type is 'list' or reply_type is 'set'
          json_reply = {}

          _.each reply, (val, key) ->
            try
              val = format_json(val)
            json_reply[key] = val
            return
          reply = json_reply
        if reply_type is 'zset'
          json_reply = {}

          _.each reply, (val, key) ->
            try
              val = format_json(val)
            json_reply[key] = val
            return
          reply = json_reply

        client.send
          title: message
          reply: reply
          reply_type: reply_type or 'string'

    return
  return
