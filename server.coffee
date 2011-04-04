express = require('express')
redis   = require('redis')
io      = require('socket.io')

redis_client = redis.createClient()

redis_client.on 'error', (error) ->
  console.log error
  
app = express.createServer()
app.use(express.static(__dirname))
app.use(express.logger({ 'format': ':method :url' }))

app.listen(8000)
console.log('listening on :8000')

socket = io.listen(app)

socket.on 'connection', (client) ->

  client.on 'message', (message) ->
    console.log message
    
    if message is '#'
      redis_client.keys '*', (err, reply) ->
        client.send(reply)
        return
    else
      redis_client.get message.substr(1), (err, reply) ->
        client.send(reply)
        return
    return

  client.on 'disconnect', ->
    return

  return
