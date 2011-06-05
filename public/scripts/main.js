(function() {
  var PageView, SocketHandler;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  PageView = (function() {
    PageView.active = [];
    PageView.are_keys = true;
    function PageView() {
      this.doc_key = __bind(this.doc_key, this);
      this.cmd_keyup = __bind(this.cmd_keyup, this);      this.results = $('ul#results');
      $('a.confirm').live('click', this.link_click);
      this.command_el = $('#command');
      this.command_el.bind('keyup', this.cmd_keyup);
      $(document).bind('keydown', this.doc_key);
    }
    PageView.prototype.getTpl = function(id) {
      return document.getElementById(id).innerHTML;
    };
    PageView.prototype.load_templates = function() {
      return this.templates = {
        keys: _.template(this.getTpl('key-template')),
        bulk: _.template(this.getTpl('bulk-template')),
        status: _.template(this.getTpl('status-template')),
        error: _.template(this.getTpl('error-template')),
        hash: _.template(this.getTpl('hash-template')),
        list: _.template(this.getTpl('list-template')),
        set: _.template(this.getTpl('set-template')),
        zset: _.template(this.getTpl('zset-template')),
        integer: _.template(this.getTpl('integer-template'))
      };
    };
    PageView.prototype.cmd_keyup = function(evt) {
      if (evt.keyCode === 13) {
        this.goto(this.command_el.val());
        return this.command_el.val('').blur();
      }
    };
    PageView.prototype.goto = function(hash) {
      return window.location.hash = hash;
    };
    PageView.prototype.show_active = function() {
      var topheight;
      if (this.active.index() % 2 === 0) {
        topheight = this.active.offset().top - (1 / 3) * $(window).height();
        return $('body').stop().animate({
          scrollTop: topheight
        }, 600);
      }
    };
    PageView.prototype.doc_key = function(evt) {
      var link;
      if (!(this.command_el.is(':focus'))) {
        switch (evt.keyCode) {
          case 191:
            return this.command_el.focus();
          case 73:
            return this.goto('#INFO');
          case 75:
          case 81:
            return this.goto('#KEYS *');
          case 74:
          case 38:
            if (this.active.prev().length > 0) {
              this.active = this.active.removeClass('active').prev().addClass('active');
              this.show_active();
              return evt.preventDefault();
            }
            break;
          case 75:
          case 40:
            if (this.active.next().length > 0) {
              this.active = this.active.removeClass('active').next().addClass('active');
              this.show_active();
              return evt.preventDefault();
            }
            break;
          case 79:
            return this.goto(this.active.find('a').attr('href'));
          case 13:
          case 39:
            link = this.active.find('a').first();
            if (link.is('.confirm')) {
              return !this.link_click();
            }
            return this.goto(link.attr('href'));
          case 88:
            if (this.active.find('a.confirm').length && this.link_click()) {
              return this.goto(this.active.find('a.confirm').attr('href'));
            }
            break;
          case 37:
            return socket.goback();
          case 73:
            return this.command_el.focus();
        }
      }
    };
    PageView.prototype.link_click = function() {
      return confirm('Are you sure you want to run this action?');
    };
    PageView.prototype.clear_results = function() {
      return this.results.empty();
    };
    PageView.prototype.update_content = function(type, message) {
      if (this.templates == null) {
        this.load_templates();
      }
      this.results.append(this.templates[type](message));
      if (this.results.has('.active').length === 0) {
        return this.active = this.results.find('li:first-child').addClass('active');
      }
    };
    return PageView;
  })();
  SocketHandler = (function() {
    function SocketHandler() {
      this.send_command = __bind(this.send_command, this);
      this.on_hashchange = __bind(this.on_hashchange, this);
      this.handle_message = __bind(this.handle_message, this);      this.socket = new io.Socket(location.hostname);
      this.socket.connect();
      $(window).bind('hashchange', this.on_hashchange);
      this.socket.on('message', this.handle_message);
    }
    SocketHandler.prototype.update = function(id, html) {
      return document.getElementById(id).innerHTML = html;
    };
    SocketHandler.prototype.handle_message = function(message) {
      this.update('title', message.title);
      this.update('subtitle', message.reply_type);
      page.are_keys = !!(message.reply_type === 'keys');
      return page.update_content(message.reply_type, message);
    };
    SocketHandler.prototype.on_hashchange = function() {
      if (window.location.hash.length > 1) {
        return this.send_command(window.location.hash.substr(1));
      }
    };
    SocketHandler.prototype.send_command = function(command) {
      page.clear_results();
      if (!command) {
        command = 'KEYS *';
      }
      return this.socket.send(command);
    };
    SocketHandler.prototype.loaded = function() {
      return this.send_command();
    };
    SocketHandler.prototype.goback = function() {
      return window.history.go(-1);
    };
    return SocketHandler;
  })();
  $(function() {
    var page, socket;
    window.page = page = new PageView();
    window.socket = socket = new SocketHandler();
    return socket.loaded();
  });
}).call(this);
