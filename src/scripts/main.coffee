class PageView
  @are_keys: true
  
  constructor: ->
    @results = $('ul#results')
    $('a.confirm').live('click', @link_click)

    @shortcuts = $('#shortcuts')
    @shortcuts.find('a#close-shortcuts').bind 'click', =>
      @toggle_shortcuts()

    @command_el = $('#command')
    @command_el.bind('keyup', @cmd_keyup)

    $(document).bind('keydown', @doc_key)
  
  get_tpl: (id) ->
    document.getElementById(id).innerHTML
  
  load_templates: () ->
    @templates =
      keys: _.template(@get_tpl('key-template'))
      bulk: _.template(@get_tpl('bulk-template'))
      status: _.template(@get_tpl('status-template'))
      error: _.template(@get_tpl('error-template'))
      hash: _.template(@get_tpl('hash-template'))
      list: _.template(@get_tpl('list-template'))
      set: _.template(@get_tpl('set-template'))
      zset: _.template(@get_tpl('zset-template'))
      integer: _.template(@get_tpl('integer-template'))
  
  cmd_keyup: (evt) =>
    if evt.keyCode is 13
      @goto(@command_el.val())
      @command_el.val('').blur()
  
  goto: (hash) ->
    window.location.hash = hash
    
  show_active: ->
    if @active.index() % 2 is 0
      topheight = (@active.offset().top - (1/3)*$(window).height())
      $('body').stop().animate({ scrollTop: topheight }, 600)

  toggle_shortcuts: ->
    @shortcuts.toggle()
    
  doc_key: (evt) =>
    if not @command_el.is(':focus') and evt.shiftKey
      switch evt.keyCode
        when 191 then @toggle_shortcuts() # shift + /
      return false

    unless (@command_el.is(':focus')) or evt.shiftKey or evt.ctrlKey
      switch evt.keyCode
        when 191 then @command_el.focus() # /
        when 73 then @goto('#INFO') # i 
        when 81 then @goto('#KEYS *') # q
        when 75, 38 # k / up arrow
          if @active.prev().length > 0
            @active = @active.removeClass('active').prev().addClass('active')
            @show_active()
            evt.preventDefault()
        when 74, 40 # j / down Arrow
          if @active.next().length > 0
            @active = @active.removeClass('active').next().addClass('active')
            @show_active()
            evt.preventDefault()
        when 13, 39, 79 # enter / right arrow / o
          link = @active.find('a').first()
          return !link_click() if link.is '.confirm'
          @goto(link.attr('href'))
        when 88 # x
          if @active.find('a.confirm').length && @link_click()
            @goto(@active.find('a.confirm').attr('href'))
        when 37 then socket.goback() # left arrow
      return false
 
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
  
  send_command: (command = 'KEYS *') =>
    page.clear_results()
    @socket.send(command)
    
  loaded: ->
    hash = window.location.hash.substring(1)
    hash = null unless hash.length > 0
    @send_command(hash)
    
  go_back: ->
    window.history.go(-1)
  
$ ->
  window.page = page = new PageView()
  window.socket = socket = new SocketHandler()
  socket.loaded()
