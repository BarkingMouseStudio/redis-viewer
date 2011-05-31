$ ->

  templates =
    'keys': _.template(document.getElementById('key-template').innerHTML)
    'bulk': _.template(document.getElementById('bulk-template').innerHTML)
    'status': _.template(document.getElementById('status-template').innerHTML)
    'error': _.template(document.getElementById('error-template').innerHTML)
    'hash': _.template(document.getElementById('hash-template').innerHTML)
    'list': _.template(document.getElementById('list-template').innerHTML)
    'set': _.template(document.getElementById('set-template').innerHTML)
    'zset': _.template(document.getElementById('zset-template').innerHTML)
    'integer': _.template(document.getElementById('integer-template').innerHTML)

  index = 0

  socket = new io.Socket(location.hostname)
  socket.connect()

  $results = $('ul#results')
  title_el = document.getElementById('title')
  subtitle_el = document.getElementById('subtitle')
  command_el = document.getElementById('command')

  are_keys = true

  socket.on 'message', (message) ->
    title_el.innerHTML = message.title
    subtitle_el.innerHTML = message.reply_type
    are_keys = if message.reply_type is 'keys' then true else false

    $results.append templates[message.reply_type](message)
    $('ul#results > li .val').removeClass('active').eq(index).addClass('active')
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
    index = 0
    socket.send(command)

  $('a').live 'click', (e) ->
    command = parse_command e.target.href
    return false if e.target.className is 'confirm' and not confirm("Are you sure you want to run this command?\n\n#{command}")
    send_command command
    return

  command_el.addEventListener 'keyup', (e) ->
    return if e.keyCode isnt 13
    send_command(command_el.value)
    command_el.value = ''
    return

  document.addEventListener 'keyup', (e) ->
    if document.activeElement.tagName.toLowerCase() isnt 'input'
      switch e.keyCode
        when 191 # /
          command_el.focus()
        when 73 # i
          window.location.hash = '#INFO'
          send_command parse_command location.href
        when 74 # j
          if are_keys
            length = $('ul#results > li .val a').length
            index++
            index = length - 1 if index > length - 1
            $('ul#results > li .val').removeClass('active').eq(index).addClass('active')
        when 75 # k
          if are_keys
            index--
            index = 0 if index < 0
            $('ul#results > li .val').removeClass('active').eq(index).addClass('active')
        when 81 # q
          window.location.hash = '#KEYS *'
          send_command parse_command location.href
        when 79 # o
          if are_keys
            window.location.hash = $('ul#results > li .val a').eq(index).attr('href')
            send_command parse_command location.href
        when 82 # r
          send_command parse_command location.href
      return
  , false
  
  send_command parse_command location.href

