(function() {
  var socket;
  window.socket = socket = new io.Socket(location.hostname);
  socket.connect();
  socket.on('connect', function() {});
  socket.on('message', function(message) {
    var $li;
    $li = $("<li style='display: none'><a href='#" + message + "'>" + message + "</a></li>");
    $('ul#results').append($li);
    $li.slideDown(150);
  });
  socket.on('disconnect', function() {});
  socket.send(location.hash ? location.hash : '#');
  $('a').live('click', function(e) {
    $('ul#results').empty();
    socket.send(e.target.href.substr(e.target.href.indexOf('#')));
  });
}).call(this);
