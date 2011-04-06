(function() {
  $(function() {
    var $command, $results, command, parse_command, socket;
    socket = new io.Socket(location.hostname);
    socket.connect();
    $results = $('ul#results');
    socket.on('message', function(message) {
      switch (message.kind) {
        case 'key':
          switch (message.type) {
            case 'string':
              $results.append("<li>\n  <a href='#GET " + message.key + "'>" + message.key + "</a>\n  <span>" + message.type + "</span>\n  <a href='#DEL " + message.key + "'>[DELETE]</a>\n</li>");
              break;
            case 'hash':
              $results.append("<li>\n  <a href='#HGETALL " + message.key + "'>" + message.key + "</a>\n  <span>" + message.type + "</span>\n  <a href='#DEL " + message.key + "'>[DELETE]</a>\n</li>");
          }
          break;
        case 'hash':
          $results.append("<li>\n  <span class='value'>" + (JSON.stringify(message.value)) + "</span><a href='#KEYS *'>[VIEW ALL]</a>\n</li>");
          break;
        case 'string':
          $results.append("<li>\n  <span class='value'>" + message.value + "</span><a href='#KEYS *'>[VIEW ALL]</a>\n</li>");
      }
    });
    parse_command = function(href) {
      var hash_index;
      hash_index = href.indexOf('#');
      if (hash_index === -1) {
        return null;
      }
      return href.substr(hash_index + 1);
    };
    $('a').live('click', function(e) {
      var command;
      $results.empty();
      command = parse_command(e.target.href);
      socket.send(command);
    });
    command = parse_command(location.href);
    console.log(command);
    socket.send(command != null ? command : 'KEYS *');
    $command = $(document.getElementById('command'));
    return $command.bind('keypress', function(e) {
      if (e.keyCode === 13) {
        location.hash = e.target.value;
      }
    });
  });
}).call(this);
