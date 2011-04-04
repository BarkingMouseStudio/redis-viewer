window.socket = socket = new io.Socket(location.hostname)
socket.connect()

socket.on 'connect', ->
  return

socket.on 'message', (message) ->
  $li = $("<li style='display: none'><a href='##{message}'>#{message}</a></li>")
  $('ul#results').append($li)
  $li.slideDown(150)
  return

socket.on 'disconnect', ->
  return

socket.send(if location.hash then location.hash else '#')

$('a').live 'click', (e) ->
  $('ul#results').empty()
  socket.send(e.target.href.substr(e.target.href.indexOf('#')))
  return
