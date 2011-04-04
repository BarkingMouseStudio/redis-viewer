(function() {
  var app, express, io, redis, redis_client, socket;
  express = require('express');
  redis = require('redis');
  io = require('socket.io');
  redis_client = redis.createClient();
  redis_client.on('error', function(error) {
    return console.log(error);
  });
  app = express.createServer();
  app.use(express.static(__dirname));
  app.use(express.logger({
    'format': ':method :url'
  }));
  app.listen(8000);
  console.log('listening on :8000');
  socket = io.listen(app);
  socket.on('connection', function(client) {
    client.on('message', function(message) {
      console.log(message);
      if (message === '#') {
        redis_client.keys('*', function(err, reply) {
          client.send(reply);
        });
      } else {
        redis_client.get(message.substr(1), function(err, reply) {
          client.send(reply);
        });
      }
    });
    client.on('disconnect', function() {});
  });
}).call(this);
