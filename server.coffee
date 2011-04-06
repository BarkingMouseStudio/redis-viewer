express = require('express')
redis   = require('redis')
io      = require('socket.io')
_ = require('underscore')

redis_client = redis.createClient()

redis_client.on 'error', (error) ->
  console.log error
  
app = express.createServer()
app.use(express.static(__dirname))
app.use(express.logger({ 'format': ':method :url' }))

app.listen(3000)
console.log('listening on :3000')

socket = io.listen(app)

socket.on 'connection', (client) ->

  client.on 'message', (message) ->
    args = message.split(' ')
    command = args.shift()
    
    # redis_client[command](args)
    
    switch command.toUpperCase()
      when 'KEYS'
        redis_client.KEYS args, (error, keys) ->
          _.each keys, (key) ->
            redis_client.type key, (error, type) ->
              client.send({ key: key, kind: 'key', type: type })
              return
            return
          return
      when 'GET'
        redis_client.GET args, (error, value) ->
          client.send({ value: value, kind: 'string' })
          return
      when 'HGETALL'
        redis_client.HGETALL args, (error, value) ->
          client.send({ value: value, kind: 'hash' })
          return
      when 'DEL'
        redis_client.DEL args, (error, value) ->
          client.send({ value: value, kind: 'string' })
          return
          
    return
  return
