(function() {
  $(function() {
    var $results, command, command_el, parse_command, send_command, socket, templates;
    templates = {
      'keys': _.template(document.getElementById('key-template').innerHTML),
      'string': _.template(document.getElementById('string-template').innerHTML),
      'hash': _.template(document.getElementById('hash-template').innerHTML)
    };
    socket = new io.Socket(location.hostname);
    socket.connect();
    $results = $('ul#results');
    command_el = document.getElementById('command');
    socket.on('message', function(message) {
      $results.append(templates[message.reply_type](message));
    });
    parse_command = function(href) {
      var hash, hash_index;
      hash_index = href.indexOf('#');
      if (hash_index === -1) {
        return null;
      }
      hash = href.substr(hash_index + 1);
      if (hash.length === 0) {
        return null;
      }
      return hash;
    };
    send_command = function(command) {
      $results.empty();
      if (!command) {
        command = 'KEYS *';
      }
      location.hash = command;
      command_el.value = command;
      return socket.send(command);
    };
    $('a').live('click', function(e) {
      var command;
      command = parse_command(e.target.href);
      send_command(command);
    });
    command = parse_command(location.href);
    send_command(command);
    return command_el.addEventListener('keypress', function(e) {
      if (e.keyCode !== 13) {
        return;
      }
      command = e.target.value;
      send_command(command);
    });
  });
}).call(this);
