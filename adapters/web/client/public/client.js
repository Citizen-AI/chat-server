const { host, pathname } = window.location
const page_url = new URL(window.location.href)
const query = page_url.searchParams.get('query')

let user_has_sent_something = false   // used to later decide whether to send GTM event

const linkify_new = text => {
  const remove_protocol = str => str.replace(/https?:\/\//i, '')
  const callback = (text, href) => href ? `<a href="${href}" target="_blank">${remove_protocol(href)}</a>`: text
  return linkify(text, { callback })
}

const message_template = `
  <div class="message {{message.type}}">
    {{#if message.isTyping}}
    <div class="typing-indicator"><span></span><span></span><span></span></div>
    {{/if}}
    {{{message.html}}}

    {{#if message.open_link}}
      <a href="{{{message.open_link}}}" target="_blank" class="button_message">{{#if message.link_title}}{{message.link_title}}{{else}}{{message.open_link}}{{/if}}</a>
    {{/if}}

    {{#each message.attachment.payload.elements}}
    <card>
      {{#if buttons}}<a href="#" onclick="javascript:Botkit.quietSend('{{buttons.0.payload}}')">{{/if}}
      <header>{{title}}</header>
      <subtitle>{{subtitle}}</subtitle>
      {{#if buttons}}</a>{{/if}}
    </card>
    {{/each}}

    {{#message.files}}
    <div class="file_attachment">
      {{#if image}}
      <a href="{{{url}}}" alt="Click for full size" target="workbot_big_image"><img src="{{{url}}}" alt="{{{url}}}" /></a>
      {{else}}
      <a href="{{{url}}}" title="{{{url}}}">{{{url}}}</a>
      {{/if}}
    </div>
    {{/message.files}}

    {{#each message.buttons}}
      {{#if postback}}
        <a href="#" onclick="javascript:Botkit.quietSend({{payload}});Botkit.tell_gtm()" class="button_message">{{title}}</a>
      {{else if map}}
        <iframe src="https://www.google.com/maps/embed/v1/search?key=AIzaSyBYTcRWDssK7eRByLCdh0OJJBlF6qQsHZI&q={{payload}}" width="100%" height="400" frameborder="0" style="border:0" allowfullscreen></iframe>
      {{else if source}}
        <div class="source">{{{contents}}}</div>
      {{else}}
        <a href="{{url}}" target="_blank" class="button_message">{{#if title}}{{title}}{{else}}{{payload}}{{/if}}</a>
      {{/if}}
    {{/each}}
  </div>
`

var Botkit = {
    config: {
        ws_url: (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + host,
        reconnect_timeout: 3000,
        max_reconnect: 5,
        enable_history: false,
    },
    options: {
        use_sockets: true,
    },
    reconnect_count: 0,
    guid: null,
    current_user: null,
    on: function (event, handler) {
        this.message_window.addEventListener(event, function (evt) {
            handler(evt.detail)
        });
    },
    once: function (event, handler) {
        once_handler = evt => {
          handler(evt.detail)
          this.message_window.removeEventListener(event, once_handler)
        }
        this.message_window.addEventListener(event, once_handler)
    },
    trigger: function (event, details) {
        var event = new CustomEvent(event, {
            detail: details
        });
        this.message_window.dispatchEvent(event);
    },
    request: function (url, body) {
        var that = this;
        return new Promise(function (resolve, reject) {
            var xmlhttp = new XMLHttpRequest();

            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState == XMLHttpRequest.DONE) {
                    if (xmlhttp.status == 200) {
                        var response = xmlhttp.responseText;
                        if (response !='') {
                            var message = null;
                            try {
                                message = JSON.parse(response);
                            } catch (err) {
                                reject(err);
                                return;
                            }
                            resolve(message);
                        } else {
                            resolve([]);
                        }
                    } else {
                        reject(new Error('status_' + xmlhttp.status));
                    }
                }
            };

            xmlhttp.open("POST", url, true)
            xmlhttp.setRequestHeader("Content-Type", "application/json")
            xmlhttp.send(JSON.stringify(body))
        });

    },
    tell_gtm: () => {
      if(!user_has_sent_something) {
        user_has_sent_something = true
        dataLayer.push({'event':'user_first_sends'})  // GTM event
      }
    },
    send: function (text, e, gtm_off) {
        var that = this
        if (e) e.preventDefault()
        if (!text) return
        var message = {
          type: 'outgoing',
          text: text
        }
        this.clearReplies()
        that.renderMessage(message)
        that.deliverMessage({
            type: 'message',
            text: text,
            user: this.guid,
            channel: this.options.use_sockets ? 'websocket' : 'webhook'
        })
        this.input.value = ''
        this.trigger('sent', message)
        if(!gtm_off) this.tell_gtm()
        return false
    },
    quietSend: function (text, e) {
        var that = this
        if (e) e.preventDefault()
        if (!text) return
        const message = { type: 'outgoing', text }
        that.deliverMessage({
          type: 'message',
          text: text,
          user: this.guid,
          channel: this.options.use_sockets ? 'websocket' : 'webhook'
        })
        // this.input.value = ''
        this.trigger('sent', message)
        return false
    },
    deliverMessage: function (message) {
        message.host = host
        if (this.options.use_sockets) {
            this.socket.send(JSON.stringify(message));
        } else {
            this.webhook(message);
        }
    },
    getHistory: function (guid) {
        var that = this;
        if (that.guid) {
            that.request('/botkit/history', {
                user: that.guid
            }).then(function (history) {
                if (history.success) {
                    that.trigger('history_loaded', history.history);
                } else {
                    that.trigger('history_error', new Error(history.error));
                }
            }).catch(function (err) {
                that.trigger('history_error', err);
            });
        }
    },
    webhook: function (message) {
        var that = this;

        that.request('/api/messages', message).then(function (messages) {
            messages.forEach((message) => {
                that.trigger(message.type, message);
            });
        }).catch(function (err) {
            that.trigger('webhook_error', err);
        });
    },
    connect: function (user) {
        var that = this
        if (user && user.id) {
            Botkit.setCookie('botkit_guid', user.id, 1);
            user.timezone_offset = new Date().getTimezoneOffset();
            that.current_user = user;
            console.log('CONNECT WITH USER', user);
        }

        // connect to the chat server!
        if (that.options.use_sockets) {
            that.connectWebsocket(that.config.ws_url);
        } else {
            that.connectWebhook();
        }
    },
    connectWebhook: function () {
        var that = this;
        if (Botkit.getCookie('botkit_guid')) {
            that.guid = Botkit.getCookie('botkit_guid');
            connectEvent = 'welcome_back';
        } else {
            that.guid = that.generate_guid();
            Botkit.setCookie('botkit_guid', that.guid, 1);
        }

        if (this.options.enable_history) {
            that.getHistory();
        }

        // connect immediately
        that.trigger('connected', {});
        that.webhook({
            type: connectEvent,
            user: that.guid,
            channel: 'webhook',
        });
    },
    connectWebsocket: function (ws_url) {
        var that = this;
        // Create WebSocket connection.
        that.socket = new WebSocket(ws_url);

        var connectEvent = 'hello';
        if (Botkit.getCookie('botkit_guid')) {
            that.guid = Botkit.getCookie('botkit_guid');
            connectEvent = 'welcome_back';
        } else {
            that.guid = that.generate_guid();
            Botkit.setCookie('botkit_guid', that.guid, 1);
        }

        if (this.options.enable_history) {
            that.getHistory();
        }

        // Connection opened
        that.socket.addEventListener('open', function (event) {
            console.log('CONNECTED TO SOCKET');
            that.reconnect_count = 0;
            that.trigger('connected', event);
            that.deliverMessage({
                type: connectEvent,
                user: that.guid,
                channel: 'socket',
                user_profile: that.current_user ? that.current_user : null,
            });
        });

        that.socket.addEventListener('error', function (event) {
            console.error('ERROR', event);
        });

        that.socket.addEventListener('close', function (event) {
            console.log('SOCKET CLOSED!');
            that.trigger('disconnected', event);
            if (that.reconnect_count < that.config.max_reconnect) {
                setTimeout(function () {
                    console.log('RECONNECTING ATTEMPT ', ++that.reconnect_count);
                    that.connectWebsocket(that.config.ws_url);
                }, that.config.reconnect_timeout);
            } else {
                that.message_window.className = 'offline';
            }
        });

        // Listen for messages
        that.socket.addEventListener('message', function (event) {
            var message = null;
            try {
                message = JSON.parse(event.data);
            } catch (err) {
                that.trigger('socket_error', err);
                return;
            }

            that.trigger(message.type, message);
        });
    },
    clearReplies: function () {
        this.replies.innerHTML = ''
    },
    quickReply: function (reply) {
        this.clearReplies()
        this.quietSend(reply.payload)
        window.clearInterval(this.placeholders.interval_id)
        this.renderMessage({
          text: reply.title,
          type: 'outgoing'
        })
        this.tell_gtm()
    },
    focus: function () { this.input.focus() },
    renderMessage: function (message) {
      var that = this;
      if (!that.next_line) {
          that.next_line = document.createElement('div')
          that.message_list.appendChild(that.next_line)
      }
      if (message.text && typeof message.text == 'string' ) {
          message.html = linkify_new(message.text)
      }
      if (message.buttons) {
        message.buttons.forEach(button => {
          if(button.source && button.contents) button.contents = linkify_new(button.contents)
          if(button.payload) button.payload = JSON.stringify(button.payload) // for multi-line tell-me-more payloads
        })
      }
      that.next_line.innerHTML = that.message_template({ message })
      if (!message.isTyping) {
          delete (that.next_line)
      }
    },
    triggerScript: function (script, thread) {
        this.deliverMessage({
            type: 'trigger',
            user: this.guid,
            channel: 'socket',
            script: script,
            thread: thread
        });
    },
    typing: function () { this.renderMessage({ isTyping: true }) },
    sendEvent: function (event) {
        if (this.parent_window) {
            this.parent_window.postMessage(event, '*');
        }
    },
    setCookie: function (cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    },
    getCookie: function (cname) {
        var name = cname + "="
        var decodedCookie = decodeURIComponent(document.cookie)
        var ca = decodedCookie.split(';')
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i]
            while (c.charAt(0) == ' ') {
                c = c.substring(1)
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length)
            }
        }
        return ""
    },
    generate_guid: function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    },

    make_quick_replies: (quick_replies, that) => {
      const list = document.createElement('ul')
      quick_replies.map(qr => {
        const li = document.createElement('li')
        const el = document.createElement('a')
        el.innerHTML = qr.title
        el.href = '#'
        el.onclick = () => that.quickReply(qr)
        li.appendChild(el)
        list.appendChild(li)
      })
      that.replies.appendChild(list)
    },

    boot: function (user) {
        var that = this
        that.message_window = document.getElementById("message_window")
        that.message_list = document.getElementById("message_list")
        that.message_template = Handlebars.compile(message_template)
        that.replies = document.getElementById('message_replies')
        that.input = document.getElementById('messenger_input')
        that.focus()
        that.on('connected', function () {
            that.message_window.className = 'connected'
            that.input.disabled = false
            that.sendEvent({ name: 'connected' })
        })
        that.on('disconnected', function () {
            // that.message_window.className = 'disconnected';
            // that.input.disabled = true
        })
        that.on('webhook_error', function (err) {
            alert('Error sending message!')
            console.error('Webhook Error', err)
        })
        that.on('typing', function () {
            that.clearReplies()
            that.typing()
        })
        that.on('sent', function () {
            // do something after sending
        })
        that.on('message', function (message) {
            console.log('RECEIVED MESSAGE', message)
            that.renderMessage(message)
        })
        that.on('message', function (message) {
            if (message.goto_link) {
                window.location = message.goto_link
            }
        })
        that.on('message', function (message) {
            that.clearReplies()
            if (message.quick_replies) {
                that.make_quick_replies(message.quick_replies, that)
                if (message.disable_input) {
                    that.input.disabled = true
                } else {
                    that.input.disabled = false
                }
            } else {
                that.input.disabled = false
            }
        })
        that.on('history_loaded', function (history) {
            if (history) {
                for (var m = 0; m < history.length; m++) {
                    that.renderMessage({
                        text: history[m].text,
                        type: history[m].type == 'message_received' ? 'outgoing' : 'incoming', // set appropriate CSS class
                    });
                }
            }
        })
        that.connect(user)
        return that
    },

    placeholders: {
      texts: ['How can I help?', 'What do you want to know?', 'Ask me anything…'],
      index: 1,
      interval_id: null,
      next: function () { return this.texts[this.index++ % this.texts.length] }
    }
}


window.onload = () => {
  const open_menu = () => document.getElementById('sidebar').classList.add('visible')
  const close_menu = () => document.getElementById('sidebar').classList.remove('visible')
  const toggle_menu = () => document.getElementById('sidebar').classList.contains('visible') ? close_menu() : open_menu()
  const handler = event => {
    close_menu()
    Botkit.send(event.target.innerText)
  }
  for(let e of document.getElementsByClassName('clickable_queries')) {
    e.addEventListener('click', handler)
  }
  document.getElementsByTagName('h1')[0].addEventListener('click', toggle_menu)
  document.getElementById('kebab_menu_icon').addEventListener('click', toggle_menu)

  Botkit.placeholders.interval_id = window.setInterval(() => Botkit.input.placeholder = Botkit.placeholders.next(), 5000)
  const button = document.getElementsByTagName('button')[0]
  button.addEventListener('click', () => window.clearInterval(Botkit.placeholders.interval_id))

  let seen_before = false
  if (Botkit.getCookie('botkit_guid')) seen_before = true

  Botkit.boot()
  if(typeof server_data != 'undefined') {  // pre-populated topic
    const { question, answer_messages } = server_data
    Botkit.renderMessage({ text: question, type: 'outgoing' })
    answer_messages.map(message => {
      Botkit.renderMessage(message)
      if(message.quick_replies) Botkit.make_quick_replies(message.quick_replies, Botkit)
    })
    const section = document.getElementsByTagName('section')[0]
    section.addEventListener('scroll', () => {
      if (section.scrollHeight - section.scrollTop === section.clientHeight)
        section.classList.remove('noscroll')
    })
    Botkit.once('connected', () => {
      Botkit.quietSend(`TOPIC_PAGE: ${server_data.question}`)
    })
  } else {
    Botkit.once('connected', () => {
      Botkit.typing()
      if(query)             Botkit.send(query, null, true)
      else if(seen_before)  Botkit.quietSend('[Web] welcome back')
      else                  Botkit.quietSend('[Web] get started')
    })
  }
}