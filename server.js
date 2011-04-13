(function() {
  var app, command_map, commands, express, format_json, io, redis, redis_client, reply_types, socket, _;
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
    'KEYS': 'key',
    'GET': 'string',
    'HGETALL': 'hash',
    'DEL': 'string',
    'SET': 'string',
    'HSET': 'string',
    'LRANGE': 'list',
    'SMEMBERS': 'set',
    'ZRANGE': 'zset'
  };
  command_map = {
    'string': 'GET',
    'hash': 'HGETALL',
    'list': 'LRANGE',
    'set': 'SMEMBERS',
    'zset': 'ZRANGE'
  };
  format_json = function(data, indent) {
    var closing_brace, html, i, is_array, next_indent;
    if (indent == null) {
      indent = '';
    }
    if (_.isNumber(data)) {
      return data;
    }
    next_indent = '  ';
    is_array = _.isArray(data);
    if (is_array) {
      if (data.length === 0) {
        return '[]';
      } else {
        closing_brace = ']';
        html = '[';
      }
    } else {
      if (_.size(data) === 0) {
        return '{}';
      } else {
        closing_brace = '}';
        html = '{';
      }
    }
    i = 0;
    _.each(data, function(val, key) {
      if (i > 0) {
        html += ', ';
      }
      if (is_array) {
        html += '\n' + indent + next_indent;
      } else {
        html += '\n' + indent + next_indent + '<strong>\"' + key + '\":</strong> ';
      }
      switch (typeof val) {
        case 'object':
          html += format_json(val, indent + next_indent);
          break;
        case 'string':
          html += '\"' + JSON.stringify(val).replace(/^"|"$/g, '').replace(/'/g, "\\'").replace(/\\"/g, '"') + '\"';
          break;
        case 'number':
          html += JSON.stringify(val);
          break;
        case 'boolean':
          html += JSON.stringify(val);
          break;
        default:
          html += '\"' + JSON.stringify(val) + '\"';
      }
      return i++;
    });
    html += '\n' + indent + closing_brace;
    return html;
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
                command: command_map[type],
                reply_type: reply_type
              });
            });
          });
        } else {
          if (reply_type === 'string') {
            try {
              json_reply = JSON.parse(reply);
              reply = format_json(json_reply);
            } catch (_e) {}
          }
          if (reply_type === 'hash' || reply_type === 'list' || reply_type === 'set') {
            json_reply = {};
            _.each(reply, function(val, key) {
              try {
                val = format_json(JSON.parse(val));
              } catch (_e) {}
              json_reply[key] = val;
            });
            reply = json_reply;
          }
          if (reply_type === 'zset') {
            json_reply = {};
            _.each(reply, function(val, key) {
              try {
                val = format_json(JSON.parse(val));
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
