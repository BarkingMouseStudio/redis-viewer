(function() {
  var app, command_map, commands, express, io, redis, redis_client, reply_types, socket, _;
  express = require('express');
  redis = require('redis');
  io = require('socket.io');
  _ = require('underscore');
  commands = require('./commands');
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
    'GET': 'string',
    'HGETALL': 'hash',
    'DEL': 'string',
    'SET': 'string',
    'HSET': 'string'
  };
  command_map = {
    'string': 'GET',
    'hash': 'HGETALL'
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
        var reply_type;
        reply_type = reply_types[command];
        if (command === 'KEYS') {
          return _.each(reply, function(key) {
            redis_client.TYPE(key, function(error, type) {
              return client.send({
                reply: key,
                type: type,
                command: command_map[type],
                reply_type: reply_type
              });
            });
          });
        } else {
          return client.send({
            reply: reply,
            reply_type: reply_type
          });
        }
      });
    });
  });
}).call(this);
