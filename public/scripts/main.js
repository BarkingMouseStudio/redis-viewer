(function() {
  $(function() {
    var $results, are_keys, command_el, index, parse_command, send_command, socket, subtitle_el, templates, title_el;
    templates = {
      'keys': _.template(document.getElementById('key-template').innerHTML),
      'bulk': _.template(document.getElementById('bulk-template').innerHTML),
      'status': _.template(document.getElementById('status-template').innerHTML),
      'error': _.template(document.getElementById('error-template').innerHTML),
      'hash': _.template(document.getElementById('hash-template').innerHTML),
      'list': _.template(document.getElementById('list-template').innerHTML),
      'set': _.template(document.getElementById('set-template').innerHTML),
      'zset': _.template(document.getElementById('zset-template').innerHTML),
      'integer': _.template(document.getElementById('integer-template').innerHTML)
    };
    index = 0;
    socket = new io.Socket(location.hostname);
    socket.connect();
    $results = $('ul#results');
    title_el = document.getElementById('title');
    subtitle_el = document.getElementById('subtitle');
    command_el = document.getElementById('command');
    are_keys = true;
    socket.on('message', function(message) {
      title_el.innerHTML = message.title;
      subtitle_el.innerHTML = message.reply_type;
      are_keys = message.reply_type === 'keys' ? true : false;
      $results.append(templates[message.reply_type](message));
      $('ul#results > li .val').removeClass('active').eq(index).addClass('active');
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
      index = 0;
      return socket.send(command);
    };
    $('a').live('click', function(e) {
      var command;
      command = parse_command(e.target.href);
      if (e.target.className === 'confirm' && !confirm("Are you sure you want to run this command?\n\n" + command)) {
        return false;
      }
      send_command(command);
    });
    command_el.addEventListener('keyup', function(e) {
      if (e.keyCode !== 13) {
        return;
      }
      send_command(command_el.value);
      command_el.value = '';
    });
    document.addEventListener('keyup', function(e) {
      var length;
      if (document.activeElement.tagName.toLowerCase() !== 'input') {
        switch (e.keyCode) {
          case 191:
            command_el.focus();
            break;
          case 73:
            window.location.hash = '#INFO';
            send_command(parse_command(location.href));
            break;
          case 74:
            if (are_keys) {
              length = $('ul#results > li .val a').length;
              index++;
              if (index > length - 1) {
                index = length - 1;
              }
              $('ul#results > li .val').removeClass('active').eq(index).addClass('active');
            }
            break;
          case 75:
            if (are_keys) {
              index--;
              if (index < 0) {
                index = 0;
              }
              $('ul#results > li .val').removeClass('active').eq(index).addClass('active');
            }
            break;
          case 81:
            window.location.hash = '#KEYS *';
            send_command(parse_command(location.href));
            break;
          case 79:
            if (are_keys) {
              window.location.hash = $('ul#results > li .val a').eq(index).attr('href');
              send_command(parse_command(location.href));
            }
            break;
          case 82:
            send_command(parse_command(location.href));
        }
      }
    }, false);
    return send_command(parse_command(location.href));
  });
}).call(this);
