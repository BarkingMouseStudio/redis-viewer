$ ->

  templates =
    'key': _.template(document.getElementById('key-template').innerHTML)
    'string': _.template(document.getElementById('string-template').innerHTML)
    'hash': _.template(document.getElementById('hash-template').innerHTML)
    'list': _.template(document.getElementById('list-template').innerHTML)
    'set': _.template(document.getElementById('set-template').innerHTML)
    'zset': _.template(document.getElementById('set-template').innerHTML)

  socket = new io.Socket(location.hostname)
  socket.connect()

  $results = $('ul#results')
  title_el = document.getElementById('title')
  subtitle_el = document.getElementById('subtitle')
  command_el = document.getElementById('command')

  socket.on 'message', (message) ->
    title_el.innerHTML = message.title
    subtitle_el.innerHTML = message.reply_type

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
    socket.send(command)

  $('a').live 'click', (e) ->
    return false if e.target.className is 'confirm' and not confirm('Are you sure?')
    send_command parse_command e.target.href
    return

  command_el.addEventListener 'keypress', (e) ->
    return if e.keyCode isnt 13
    send_command(e.target.value)
    e.target.value = ''
    return

  send_command parse_command location.href

