(function() {
  var app, commands, express, io, key_command_map, redis, redis_client, reply_types, socket, _;
  express = require('express');
  redis = require('redis');
  io = require('socket.io');
  _ = require('underscore');
  commands = require('./commands');
  redis.debug_mode = true;
  redis_client = redis.createClient();
  redis_client.on('error', function(error) {
    console.log(error);
  });
  app = express.createServer();
  app.use(express.static(__dirname));
  app.use(express.logger({
    'format': ':method :url'
  }));
  app.listen(3000);
  console.log('listening on :3000');
  socket = io.listen(app);
  reply_types = {
    APPEND: 'integer',
    AUTH: 'status',
    BGREWRITEAOF: 'status',
    BGSAVE: 'status',
    BLPOP: null,
    BRPOP: null,
    BRPOPLPUSH: null,
    'CONFIG GET': null,
    'CONFIG SET': null,
    'CONFIG RESETSTAT': null,
    DBSIZE: 'integer',
    DECR: 'integer',
    DECRBY: 'integer',
    DEL: 'integer',
    DISCARD: 'status',
    ECHO: 'bulk',
    EXEC: null,
    EXISTS: 'integer',
    EXPIRE: 'integer',
    EXPIREAT: 'integer',
    FLUSHALL: 'status',
    FLUSHDB: 'status',
    GET: 'bulk',
    GETBIT: 'integer',
    GETRANGE: 'bulk',
    GETSET: 'bulk',
    HDEL: 'integer',
    HEXISTS: 'integer',
    HGET: 'bulk',
    HGETALL: 'hash',
    HINCRBY: 'integer',
    HKEYS: 'list',
    HLEN: 'integer',
    HMGET: 'list',
    HMSET: 'status',
    HSET: 'integer',
    HSETNX: 'integer',
    HVALS: 'list',
    INCR: 'integer',
    INCRBY: 'integer',
    INFO: 'bulk',
    KEYS: 'keys',
    LASTSAVE: 'integer',
    LINDEX: 'bulk',
    LINSERT: 'integer',
    LLEN: 'integer',
    LPOP: 'bulk',
    LPUSH: 'integer',
    LPUSHX: 'integer',
    LRANGE: 'list',
    LREM: 'integer',
    LSET: 'status',
    LTRIM: 'status',
    MGET: 'list',
    MONITOR: null,
    MOVE: 'integer',
    MSET: 'status',
    MSETNX: 'integer',
    MULTI: 'status',
    OBJECT: null,
    PERSIST: 'integer',
    PING: 'status',
    PSUBSCRIBE: null,
    PUBLISH: 'integer',
    PUNSUBSCRIBE: null,
    QUIT: 'status',
    RANDOMKEY: 'bulk',
    RENAME: 'status',
    RENAMENX: 'integer',
    RPOP: 'bulk',
    RPOPLPUSH: 'bulk',
    RPUSH: 'integer',
    RPUSHX: 'integer',
    SADD: 'integer',
    SAVE: null,
    SCARD: 'integer',
    SDIFF: 'list',
    SDIFFSTORE: 'integer',
    SELECT: 'status',
    SET: 'status',
    SETBIT: 'integer',
    SETEX: 'status',
    SETNX: 'integer',
    SETRANGE: 'integer',
    SHUTDOWN: 'status',
    SINTER: 'list',
    SINTERSTORE: 'integer',
    SISMEMBER: 'integer',
    SLAVEOF: 'status',
    SMEMBERS: 'set',
    SMOVE: 'integer',
    SORT: 'list',
    SPOP: 'bulk',
    SRANDMEMBER: 'bulk',
    SREM: 'integer',
    STRLEN: 'integer',
    SUBSCRIBE: null,
    SUNION: 'list',
    SUNIONSTORE: 'integer',
    SYNC: null,
    TTL: 'integer',
    TYPE: 'status',
    UNSUBSCRIBE: null,
    UNWATCH: 'status',
    WATCH: 'status',
    ZADD: 'integer',
    ZCARD: 'integer',
    ZCOUNT: 'integer',
    ZINCRBY: 'bulk',
    ZINTERSTORE: 'integer',
    ZRANGE: 'zset',
    ZRANGEBYSCORE: 'zset',
    ZRANK: 'integer',
    ZREM: 'integer',
    ZREMRANGEBYRANK: 'integer',
    ZREMRANGEBYSCORE: 'integer',
    ZREVRANGE: 'zset',
    ZREVRANGEBYSCORE: 'zset',
    ZREVRANK: 'integer',
    ZSCORE: 'bulk',
    ZUNIONSTORE: 'integer'
  };
  key_command_map = {
    string: 'GET',
    hash: 'HGETALL',
    list: 'LRANGE',
    set: 'SMEMBERS',
    zset: 'ZRANGE'
  };
  socket.on('connection', function(client) {
    client.on('message', function(message) {
      var args, command, reply_type;
      args = message.match(/(["'])(?:\\\1|.)*?\1|\S+/g);
      command = args.shift().toUpperCase();
      args = _.map(args, function(arg) {
        return arg.replace(/^(["'])(.*?)\1$/g, '$2');
      });
      if (!command in commands) {
        return;
      }
      reply_type = reply_types[command] || 'bulk';
      redis_client.send_command(command, args, function(error, reply) {
        var response, scores, vals;
        if (command === 'KEYS') {
          _.each(reply, function(key) {
            return redis_client.TYPE(key, function(error, type) {
              return client.send({
                title: message,
                reply: key,
                reply_type: reply_type,
                key_command: key_command_map[type],
                type: type
              });
            });
          });
        } else {
          switch (reply_type) {
            case 'bulk':
              try {
                reply = JSON.stringify(JSON.parse(reply), null, 2);
              } catch (_e) {}
              break;
            case 'zset':
              if (_.include(args, 'WITHSCORES')) {
                vals = _.select(reply, function(val, i) {
                  return i % 2 === 0;
                });
                scores = _.select(reply, function(score, i) {
                  return i % 2 === 1;
                });
                reply = {};
                _.each(vals, function(val, i) {
                  return reply["" + i + ":" + scores[i]] = val;
                });
              } else {
                _.each(reply, function(val, key) {
                  try {
                    reply[key] = JSON.stringify(JSON.parse(val), null, 2);
                  } catch (_e) {}
                });
              }
              break;
            case 'hash':
            case 'list':
            case 'set':
            case 'zset':
              _.each(reply, function(val, key) {
                try {
                  reply[key] = JSON.stringify(JSON.parse(val), null, 2);
                } catch (_e) {}
              });
          }
          if (!(error != null)) {
            response = {
              title: message,
              reply: reply,
              reply_type: reply_type
            };
          } else {
            response = {
              title: message,
              reply: error.message,
              reply_type: 'error'
            };
          }
          client.send(response);
        }
      });
    });
  });
}).call(this);
