(function() {
  var app, commands, express, format_json, io, key_command_map, redis, redis_client, reply_types, socket, _;
  express = require('express');
  redis = require('redis');
  io = require('socket.io');
  _ = require('underscore');
  commands = require('./commands');
  format_json = require('./format_json');
  _.each(commands, function(val, key) {
    return console.log(key);
  });
  redis.debug_mode = true;
  redis_client = redis.createClient();
  redis_client.on('error', function(error) {
    return console.log(error);
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
    'KEYS': 'keys',
    'HGETALL': 'hash',
    'LRANGE': 'list',
    'SMEMBERS': 'set',
    'ZRANGE': 'zset',
    'ZADD': 'integer'
  };
  key_command_map = {
    'string': 'GET',
    'hash': 'HGETALL',
    'list': 'LRANGE',
    'set': 'SMEMBERS',
    'zset': 'ZRANGE'
  };
  socket.on('connection', function(client) {
    client.on('message', function(message) {
      var args, command;
      args = message.match(/(["'])(?:\\\1|.)*?\1|\S+/g);
      command = args.shift().toUpperCase();
      args = _.map(args, function(arg) {
        return arg.replace(/^(["'])(.*?)\1$/g, '$2');
      });
      if (!command in commands) {
        return;
      }
      redis_client[command](args, function(error, reply) {
        var json_reply, reply_type;
        reply_type = reply_types[command];
        if (command === 'KEYS') {
          return _.each(reply, function(key) {
            redis_client.TYPE(key, function(error, type) {
              return client.send({
                reply: key,
                type: type,
                title: message,
                command: key_command_map[type],
                reply_type: reply_type
              });
            });
          });
        } else {
          if (reply_type === 'string') {
            try {
              reply = format_json(reply);
            } catch (_e) {}
          }
          if (reply_type === 'hash' || reply_type === 'list' || reply_type === 'set') {
            json_reply = {};
            _.each(reply, function(val, key) {
              try {
                val = format_json(val);
              } catch (_e) {}
              json_reply[key] = val;
            });
            reply = json_reply;
          }
          if (reply_type === 'zset') {
            json_reply = {};
            _.each(reply, function(val, key) {
              try {
                val = format_json(val);
              } catch (_e) {}
              json_reply[key] = val;
            });
            reply = json_reply;
          }
          return client.send({
            title: message,
            reply: reply,
            reply_type: reply_type || 'string'
          });
        }
      });
    });
  });
}).call(this);
