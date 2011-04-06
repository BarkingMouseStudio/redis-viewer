$ ->

  templates =
    'keys': _.template(document.getElementById('key-template').innerHTML)
    'string': _.template(document.getElementById('string-template').innerHTML)
    'hash': _.template(document.getElementById('hash-template').innerHTML)

  socket = new io.Socket(location.hostname)
  socket.connect()

  $results = $('ul#results')
  command_el = document.getElementById('command');

  socket.on 'message', (message) ->
    $results.append templates[message.reply_type](message)
    return

  parse_command = (href) ->
    hash_index = href.indexOf('#')
    return null if hash_index is -1
    hash = href.substr(hash_index + 1)
    return null if hash.length is 0
    return hash

  send_command = (command) ->
    $results.empty()
    command = 'KEYS *' if not command
    location.hash = command
    command_el.value = command
    socket.send(command)
    
  $('a').live 'click', (e) ->
    command = parse_command(e.target.href)
    send_command(command)
    return

  command = parse_command(location.href)
  send_command(command)

  command_el.addEventListener 'keypress', (e) ->
    return if e.keyCode isnt 13
    command = e.target.value
    send_command(command)
    return