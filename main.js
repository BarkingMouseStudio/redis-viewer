(function() {
  $(function() {
    var $results, command_el, parse_command, send_command, socket, subtitle_el, templates, title_el;
    templates = {
      'keys': _.template(document.getElementById('key-template').innerHTML),
      'string': _.template(document.getElementById('string-template').innerHTML),
      'hash': _.template(document.getElementById('hash-template').innerHTML),
      'list': _.template(document.getElementById('list-template').innerHTML),
      'set': _.template(document.getElementById('set-template').innerHTML),
      'zset': _.template(document.getElementById('zset-template').innerHTML),
      'integer': _.template(document.getElementById('integer-template').innerHTML)
    };
    socket = new io.Socket(location.hostname);
    socket.connect();
    $results = $('ul#results');
    title_el = document.getElementById('title');
    subtitle_el = document.getElementById('subtitle');
    command_el = document.getElementById('command');
    socket.on('message', function(message) {
      title_el.innerHTML = message.title;
      subtitle_el.innerHTML = message.reply_type;
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
      return socket.send(command);
    };
    $('a').live('click', function(e) {
      if (e.target.className === 'confirm' && !confirm('Are you sure?')) {
        return false;
      }
      send_command(parse_command(e.target.href));
    });
    command_el.addEventListener('keypress', function(e) {
      if (e.keyCode !== 13) {
        return;
      }
      send_command(e.target.value);
      e.target.value = '';
    });
    return send_command(parse_command(location.href));
  });
}).call(this);
