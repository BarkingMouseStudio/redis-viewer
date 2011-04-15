express = require('express')
redis   = require('redis')
io      = require('socket.io')
_ = require('underscore')
commands = require('./commands')

_.each commands, (val, key) ->
  console.log key

# redis.debug_mode = true
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
  APPEND: ''
  AUTH: ''
  BGREWRITEAOF: ''
  BGSAVE: ''
  BLPOP: ''
  BRPOP: ''
  BRPOPLPUSH: ''
  DBSIZE: ''
  DECR: ''
  DECRBY: ''
  DEL: ''
  DISCARD: ''
  ECHO: ''
  EXEC: ''
  EXISTS: ''
  EXPIRE: ''
  EXPIREAT: ''
  FLUSHALL: ''
  FLUSHDB: ''
  GET: 'string'
  GETBIT: ''
  GETRANGE: ''
  GETSET: ''
  HDEL: ''
  HEXISTS: ''
  HGET: ''
  HGETALL: 'hash'
  HINCRBY: ''
  HKEYS: ''
  HLEN: ''
  HMGET: ''
  HMSET: ''
  HSET: ''
  HSETNX: ''
  HVALS: ''
  INCR: ''
  INCRBY: ''
  INFO: ''
  KEYS: 'keys'
  LASTSAVE: ''
  LINDEX: ''
  LINSERT: ''
  LLEN: ''
  LPOP: ''
  LPUSH: ''
  LPUSHX: ''
  LRANGE: 'list'
  LREM: ''
  LSET: ''
  LTRIM: ''
  MGET: ''
  MONITOR: ''
  MOVE: ''
  MSET: ''
  MSETNX: ''
  MULTI: ''
  PERSIST: ''
  PING: ''
  PSUBSCRIBE: ''
  PUBLISH: ''
  PUNSUBSCRIBE: ''
  QUIT: ''
  RANDOMKEY: ''
  RENAME: ''
  RENAMENX: ''
  RPOP: ''
  RPOPLPUSH: ''
  RPUSH: ''
  RPUSHX: ''
  SADD: ''
  SAVE: ''
  SCARD: ''
  SDIFF: ''
  SDIFFSTORE: ''
  SELECT: ''
  SET: ''
  SETBIT: ''
  SETEX: ''
  SETNX: ''
  SETRANGE: ''
  SHUTDOWN: ''
  SINTER: ''
  SINTERSTORE: ''
  SISMEMBER: ''
  SLAVEOF: ''
  SMEMBERS: 'set'
  SMOVE: ''
  SORT: ''
  SPOP: ''
  SRANDMEMBER: ''
  SREM: ''
  STRLEN: ''
  SUBSCRIBE: ''
  SUNION: ''
  SUNIONSTORE: ''
  SYNC: ''
  TTL: ''
  TYPE: ''
  UNSUBSCRIBE: ''
  UNWATCH: ''
  WATCH: ''
  ZADD: 'integer'
  ZCARD: ''
  ZCOUNT: ''
  ZINCRBY: ''
  ZINTERSTORE: ''
  ZRANGE: 'zset'
  ZRANGEBYSCORE: ''
  ZRANK: ''
  ZREM: ''
  ZREMRANGEBYRANK: ''
  ZREMRANGEBYSCORE: ''
  ZREVRANGE: 'zset'
  ZREVRANGEBYSCORE: 'zset'
  ZREVRANK: 'zset'
  ZSCORE: ''
  ZUNIONSTORE: ''

key_command_map =
  string: 'GET'
  hash: 'HGETALL'
  list: 'LRANGE'
  set: 'SMEMBERS'
  zset: 'ZRANGE'

socket.on 'connection', (client) ->

  client.on 'message', (message) ->
    args = message.match(/(["'])(?:\\\1|.)*?\1|\S+/g) #"
    command = args.shift().toUpperCase()

    args = _.map args, (arg) ->
      return arg.replace(/^(["'])(.*?)\1$/g, '$2') #"

    return if not command of commands

    reply_type = reply_types[command] or 'string'

    redis_client.send_command command, args, (error, reply) ->
      if command is 'KEYS'
        _.each reply, (key) ->
          redis_client.TYPE key, (error, type) ->
            client.send
              title: message
              reply: key
              reply_type: reply_type
              key_command: key_command_map[type]
              type: type
      else
        switch reply_type
          when 'string'
            try
              reply = JSON.stringify(JSON.parse(reply), null, 2)
          when 'zset'
            if _.include args, 'WITHSCORES'
              vals = _.select reply, (val, i) ->
                return i % 2 == 0

              scores = _.select reply, (score, i) ->
                return i % 2 == 1

              reply = {}
              
              _.each vals, (val, i) ->
                reply[scores[i]] = val
            else
              _.each reply, (val, key) ->
                try
                  reply[key] = JSON.stringify(JSON.parse(val), null, 2)
                return
          when 'hash', 'list', 'set'
            _.each reply, (val, key) ->
              try
                reply[key] = JSON.stringify(JSON.parse(val), null, 2)
              return

        client.send
          title: message
          reply: reply
          reply_type: reply_type
      return

    return

  return
