$ ->

  socket = new io.Socket(location.hostname)
  socket.connect()

  
  $results = $('ul#results')

  
  socket.on 'message', (message) ->
    switch message.kind
      when 'key'
        switch message.type
          when 'string'
            $results.append """
                            <li>
                              <a href='#GET #{message.key}'>#{message.key}</a>
                              <span>#{message.type}</span>
                              <a href='#DEL #{message.key}'>[DELETE]</a>
                            </li>
                            """
          when 'hash'
            $results.append """
                            <li>
                              <a href='#HGETALL #{message.key}'>#{message.key}</a>
                              <span>#{message.type}</span>
                              <a href='#DEL #{message.key}'>[DELETE]</a>
                            </li>
                            """
      when 'hash'
        $results.append """
                        <li>
                          <span class='value'>#{JSON.stringify(message.value)}</span><a href='#KEYS *'>[VIEW ALL]</a>
                        </li>
                        """
      when 'string'
        $results.append """
                        <li>
                          <span class='value'>#{message.value}</span><a href='#KEYS *'>[VIEW ALL]</a>
                        </li>
                        """
    return
  
  
  parse_command = (href) ->
    hash_index = href.indexOf('#')
    return null if hash_index is -1
    return href.substr(hash_index + 1)
  
  
  $('a').live 'click', (e) ->
    $results.empty()
    
    command = parse_command(e.target.href)
    socket.send(command)
    
    return
  
  
  command = parse_command(location.href)
  console.log command
  socket.send(if command? then command else 'KEYS *')
  
  
  $command = $(document.getElementById('command'));
  $command.bind 'keypress', (e) ->
    location.hash = e.target.value if e.keyCode is 13
    return