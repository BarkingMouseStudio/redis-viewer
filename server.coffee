process.title = 'redis-viewer'

argv = require('optimist').argv

ip = argv.ip ? argv.i ? '127.0.0.1'
port = argv.port ? argv.p ? 6379
pass = argv.pass ? argv.x ? null

console.log("observing #{ip}:#{port}")

express = require('express')
redis   = require('redis')
io      = require('socket.io')
_ = require('underscore')

# redis.debug_mode = true
redis_client = redis.createClient(port, ip)

if pass?
  redis_client.auth pass

redis_client.on 'error', (error) ->
  console.log error
  return

app = express.createServer()
app.use(express.logger({ 'format': ':method :url' })) #'
app.use(express.favicon())
app.use(express.compiler(src: __dirname + '/src', dest: __dirname + '/public', enable: ['less', 'coffeescript']))
app.use(express.static(__dirname + '/public'))

app.listen(3000)
console.log('listening on :3000')

socket = io.listen(app)

# map the command to the type of data it'll return
reply_types =
  APPEND: 'integer'
  AUTH: 'status'
  BGREWRITEAOF: 'status'
  BGSAVE: 'status'
  BLPOP: null
  BRPOP: null
  BRPOPLPUSH: null
  'CONFIG GET': null
  'CONFIG SET': null
  'CONFIG RESETSTAT': null
  DBSIZE: 'integer'
  DECR: 'integer'
  DECRBY: 'integer'
  DEL: 'integer'
  DISCARD: 'status'
  ECHO: 'bulk'
  EXEC: null
  EXISTS: 'integer'
  EXPIRE: 'integer'
  EXPIREAT: 'integer'
  FLUSHALL: 'status'
  FLUSHDB: 'status'
  GET: 'bulk'
  GETBIT: 'integer'
  GETRANGE: 'bulk'
  GETSET: 'bulk'
  HDEL: 'integer'
  HEXISTS: 'integer'
  HGET: 'bulk'
  HGETALL: 'hash'
  HINCRBY: 'integer'
  HKEYS: 'list'
  HLEN: 'integer'
  HMGET: 'list'
  HMSET: 'status'
  HSET: 'integer'
  HSETNX: 'integer'
  HVALS: 'list'
  INCR: 'integer'
  INCRBY: 'integer'
  INFO: 'bulk'
  KEYS: 'keys'
  LASTSAVE: 'integer'
  LINDEX: 'bulk'
  LINSERT: 'integer'
  LLEN: 'integer'
  LPOP: 'bulk'
  LPUSH: 'integer'
  LPUSHX: 'integer'
  LRANGE: 'list'
  LREM: 'integer'
  LSET: 'status'
  LTRIM: 'status'
  MGET: 'list'
  MONITOR: null
  MOVE: 'integer'
  MSET: 'status'
  MSETNX: 'integer'
  MULTI: 'status'
  OBJECT: null
  PERSIST: 'integer'
  PING: 'status'
  PSUBSCRIBE: null
  PUBLISH: 'integer'
  PUNSUBSCRIBE: null
  QUIT: 'status'
  RANDOMKEY: 'bulk'
  RENAME: 'status'
  RENAMENX: 'integer'
  RPOP: 'bulk'
  RPOPLPUSH: 'bulk'
  RPUSH: 'integer'
  RPUSHX: 'integer'
  SADD: 'integer'
  SAVE: null
  SCARD: 'integer'
  SDIFF: 'list'
  SDIFFSTORE: 'integer'
  SELECT: 'status'
  SET: 'status'
  SETBIT: 'integer'
  SETEX: 'status'
  SETNX: 'integer'
  SETRANGE: 'integer'
  SHUTDOWN: 'status'
  SINTER: 'list'
  SINTERSTORE: 'integer'
  SISMEMBER: 'integer'
  SLAVEOF: 'status'
  SMEMBERS: 'set'
  SMOVE: 'integer'
  SORT: 'list'
  SPOP: 'bulk'
  SRANDMEMBER: 'bulk'
  SREM: 'integer'
  STRLEN: 'integer'
  SUBSCRIBE: null
  SUNION: 'list'
  SUNIONSTORE: 'integer'
  SYNC: null
  TTL: 'integer'
  TYPE: 'status'
  UNSUBSCRIBE: null
  UNWATCH: 'status'
  WATCH: 'status'
  ZADD: 'integer'
  ZCARD: 'integer'
  ZCOUNT: 'integer'
  ZINCRBY: 'bulk'
  ZINTERSTORE: 'integer'
  ZRANGE: 'zset'
  ZRANGEBYSCORE: 'zset'
  ZRANK: 'integer'
  ZREM: 'integer'
  ZREMRANGEBYRANK: 'integer'
  ZREMRANGEBYSCORE: 'integer'
  ZREVRANGE: 'zset'
  ZREVRANGEBYSCORE: 'zset'
  ZREVRANK: 'integer'
  ZSCORE: 'bulk'
  ZUNIONSTORE: 'integer'

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

    if command is 'CONFIG'
      command += " #{args.shift().toUpperCase()}"

    args = _.map args, (arg) ->
      return arg.replace(/^(["'])(.*?)\1$/g, '$2') #"

    return if not command of reply_types

    reply_type = reply_types[command] or 'bulk'

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
        return

      if reply_type is 'zset' and _.include args, 'WITHSCORES' # handle scores in zsets as keys
        vals = _.select reply, (val, i) ->
          return i % 2 == 0
        scores = _.select reply, (score, i) ->
          return i % 2 == 1
        rows = []
        _.each vals, (val, i) ->
          rows.push({ index: i, val: val, score: scores[i] })
        reply = rows
      else if reply_type is 'hash' or reply_type is 'list' or reply_type is 'set' or reply_type is 'zset'
        rows = []
        _.each reply, (val, key) ->
          try
            val = JSON.stringify(JSON.parse(val), null, 2)
          rows.push({ index: key, val: val })
          return
        reply = rows
      else
        if reply?
          try # attempt to parse bulk values containing JSON
            reply = JSON.stringify(JSON.parse(reply), null, 2)
        else
          reply = '(nil)'

      if not error?
        response =
          title: message
          key: args[0]
          reply: reply
          reply_type: reply_type
      else
        response =
          title: message
          reply: error.message
          reply_type: 'error'

      client.send response

      return

    return

  return
