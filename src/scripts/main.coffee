class PageView
  @active = []
  @are_keys: true
  
  constructor: ->
    @results = $('ul#results')
    $('a.confirm').live('click', @link_click)
    @command_el = $('#command')
    @command_el.bind('keyup', @cmd_keyup)
    $(document).bind('keydown', @doc_key)
  
  getTpl: (id) ->
    document.getElementById(id).innerHTML
  
  load_templates: () ->
    @templates =
      keys:    _.template(@getTpl('key-template'))
      bulk:    _.template(@getTpl('bulk-template'))
      status:  _.template(@getTpl('status-template'))
      error:   _.template(@getTpl('error-template'))
      hash:    _.template(@getTpl('hash-template'))
      list:    _.template(@getTpl('list-template'))
      set:     _.template(@getTpl('set-template'))
      zset:    _.template(@getTpl('zset-template'))
      integer: _.template(@getTpl('integer-template'))
  
  cmd_keyup: (evt) =>
    if evt.keyCode == 13
      @goto(@command_el.val())
      @command_el.val('').blur()
  
  goto: (hash) ->
    window.location.hash = hash
    
  show_active: ->
    if (@active.index() % 2 == 0)
      topheight = (@active.offset().top - (1/3)*$(window).height())
      $('body').stop().animate({scrollTop: topheight}, 600)
    
  doc_key: (evt) =>
    unless (@command_el.is(':focus'))
      switch evt.keyCode
        when 191 then @command_el.focus()
        when 73 then @goto('#INFO') 
        when 75, 81 then @goto('#KEYS *')
        when 74, 38 # Up arrow
          if @active.prev().length > 0
            @active = @active.removeClass('active').prev().addClass('active')
            @show_active()
            evt.preventDefault()
        when 75, 40 # Down Arrow
          if @active.next().length > 0
            @active = @active.removeClass('active').next().addClass('active')
            @show_active()
            evt.preventDefault()
        when 79     then @goto(@active.find('a').attr('href')) # Back Arrow
        when 13, 39
          link = @active.find('a').first()
          return !@link_click() if link.is '.confirm'
          @goto(link.attr('href')) # Enter / Next Arrow
        when 88
          if @active.find('a.confirm').length && @link_click()
            @goto(@active.find('a.confirm').attr('href'))
        when 37 then socket.goback()     # left arrow
        when 73 then @command_el.focus() # i
        
 
  link_click: ->
    confirm('Are you sure you want to run this action?')
  
  clear_results: ->
    @results.empty()
  
  update_content: (type, message) ->
    @load_templates() unless @templates?
    @results.append @templates[type](message)
    if @results.has('.active').length == 0
      @active = @results.find('li:first-child').addClass('active')
  
class SocketHandler
  constructor: ->
    @socket = new io.Socket(location.hostname)
    @socket.connect()
    $(window).bind('hashchange', @on_hashchange)
    @socket.on('message', @handle_message)
    
  update: (id, html) ->
    document.getElementById(id).innerHTML = html
  
  handle_message: (message) =>
    @update 'title', message.title
    @update 'subtitle', message.reply_type
    page.are_keys = !!(message.reply_type == 'keys')
    page.update_content(message.reply_type, message)
  
  on_hashchange: =>
    @send_command(window.location.hash.substr(1)) if window.location.hash.length > 1
  
  send_command: (command) =>
    page.clear_results()
    if (!command)
      command = 'KEYS *'
    return @socket.send(command)
    
  loaded: ->
    @send_command()
    
  goback: ->
    window.history.go(-1)
  
  
$ ->
  window.page = page =     new PageView()
  window.socket = socket = new SocketHandler()
  socket.loaded()
