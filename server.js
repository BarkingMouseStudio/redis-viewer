(function() {
  var app, commands, express, io, key_command_map, redis, redis_client, reply_types, socket, _;
  express = require('express');
  redis = require('redis');
  io = require('socket.io');
  _ = require('underscore');
  commands = require('./commands');
  _.each(commands, function(val, key) {
    return console.log(key);
  });
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
    APPEND: '',
    AUTH: '',
    BGREWRITEAOF: '',
    BGSAVE: '',
    BLPOP: '',
    BRPOP: '',
    BRPOPLPUSH: '',
    DBSIZE: '',
    DECR: '',
    DECRBY: '',
    DEL: '',
    DISCARD: '',
    ECHO: '',
    EXEC: '',
    EXISTS: '',
    EXPIRE: '',
    EXPIREAT: '',
    FLUSHALL: '',
    FLUSHDB: '',
    GET: 'string',
    GETBIT: '',
    GETRANGE: '',
    GETSET: '',
    HDEL: '',
    HEXISTS: '',
    HGET: '',
    HGETALL: 'hash',
    HINCRBY: '',
    HKEYS: '',
    HLEN: '',
    HMGET: '',
    HMSET: '',
    HSET: '',
    HSETNX: '',
    HVALS: '',
    INCR: '',
    INCRBY: '',
    INFO: '',
    KEYS: 'keys',
    LASTSAVE: '',
    LINDEX: '',
    LINSERT: '',
    LLEN: '',
    LPOP: '',
    LPUSH: '',
    LPUSHX: '',
    LRANGE: 'list',
    LREM: '',
    LSET: '',
    LTRIM: '',
    MGET: '',
    MONITOR: '',
    MOVE: '',
    MSET: '',
    MSETNX: '',
    MULTI: '',
    PERSIST: '',
    PING: '',
    PSUBSCRIBE: '',
    PUBLISH: '',
    PUNSUBSCRIBE: '',
    QUIT: '',
    RANDOMKEY: '',
    RENAME: '',
    RENAMENX: '',
    RPOP: '',
    RPOPLPUSH: '',
    RPUSH: '',
    RPUSHX: '',
    SADD: '',
    SAVE: '',
    SCARD: '',
    SDIFF: '',
    SDIFFSTORE: '',
    SELECT: '',
    SET: '',
    SETBIT: '',
    SETEX: '',
    SETNX: '',
    SETRANGE: '',
    SHUTDOWN: '',
    SINTER: '',
    SINTERSTORE: '',
    SISMEMBER: '',
    SLAVEOF: '',
    SMEMBERS: 'set',
    SMOVE: '',
    SORT: '',
    SPOP: '',
    SRANDMEMBER: '',
    SREM: '',
    STRLEN: '',
    SUBSCRIBE: '',
    SUNION: '',
    SUNIONSTORE: '',
    SYNC: '',
    TTL: '',
    TYPE: '',
    UNSUBSCRIBE: '',
    UNWATCH: '',
    WATCH: '',
    ZADD: 'integer',
    ZCARD: '',
    ZCOUNT: '',
    ZINCRBY: '',
    ZINTERSTORE: '',
    ZRANGE: 'zset',
    ZRANGEBYSCORE: '',
    ZRANK: '',
    ZREM: '',
    ZREMRANGEBYRANK: '',
    ZREMRANGEBYSCORE: '',
    ZREVRANGE: 'zset',
    ZREVRANGEBYSCORE: 'zset',
    ZREVRANK: 'zset',
    ZSCORE: '',
    ZUNIONSTORE: ''
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
      reply_type = reply_types[command] || 'string';
      redis_client.send_command(command, args, function(error, reply) {
        var scores, vals;
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
            case 'string':
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
                  return reply[scores[i]] = val;
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
              _.each(reply, function(val, key) {
                try {
                  reply[key] = JSON.stringify(JSON.parse(val), null, 2);
                } catch (_e) {}
              });
          }
          client.send({
            title: message,
            reply: reply,
            reply_type: reply_type
          });
        }
      });
    });
  });
}).call(this);
