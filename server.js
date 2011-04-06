(function() {
  var app, express, io, redis, redis_client, socket, _;
  express = require('express');
  redis = require('redis');
  io = require('socket.io');
  _ = require('underscore');
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
  socket.on('connection', function(client) {
    client.on('message', function(message) {
      var args, command;
      args = message.split(' ');
      command = args.shift();
      switch (command.toUpperCase()) {
        case 'KEYS':
          redis_client.KEYS(args, function(error, keys) {
            _.each(keys, function(key) {
              redis_client.type(key, function(error, type) {
                client.send({
                  key: key,
                  kind: 'key',
                  type: type
                });
              });
            });
          });
          break;
        case 'GET':
          redis_client.GET(args, function(error, value) {
            client.send({
              value: value,
              kind: 'string'
            });
          });
          break;
        case 'HGETALL':
          redis_client.HGETALL(args, function(error, value) {
            client.send({
              value: value,
              kind: 'hash'
            });
          });
          break;
        case 'DEL':
          redis_client.DEL(args, function(error, value) {
            client.send({
              value: value,
              kind: 'string'
            });
          });
      }
    });
  });
}).call(this);
