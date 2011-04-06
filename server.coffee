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
app.use(express.logger({ 'format': ':method :url' }))

app.listen(3000)
console.log('listening on :3000')

socket = io.listen(app)

reply_types =
  'KEYS': 'keys'
  'GET': 'string'
  'HGETALL': 'hash'
  'DEL': 'string'
  'SET': 'string'
  'HSET': 'string'
  
command_map =
  'string': 'GET'
  'hash': 'HGETALL'

socket.on 'connection', (client) ->

  client.on 'message', (message) ->
    args = message.match(/(["'])(?:\\\1|.)*?\1|\S+/g)
    command = args.shift().toUpperCase()
    
    args = _.map args, (arg) ->
      return arg.replace(/^(["'])(.*?)\1$/g, '$2')

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
        client.send
          reply: reply
          reply_type: reply_type

    return
  return
