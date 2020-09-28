'use strict'

const bus = require('../event_bus')
const botkit = require('./botkit').controller
const { regex, adapter_name } = require('../helpers')
const { NODE_ENV } = process.env

const message_and_postback_handler = (bot, client_message) => {
  if(!client_message.text) {
    bus.emit('Error: client_message.text is empty. client_message: ', client_message)
    return
  }
  const adapter_type = adapter_name(bot)
  if(NODE_ENV === 'development') console.log(client_message.text)
  let event
  if(client_message.text.match(regex.web_get_started) ||
     client_message.text.match(regex.web_welcome_back) ||
     client_message.text.match(regex.fb_get_started))
    event = `${adapter_type} user starts`
  else if(client_message.text.match(regex.tell_me_more))
    event = `postback from ${adapter_type}: tell me more`
  else if(client_message.text.match(regex.intent_key) || client_message.quick_reply?.payload.match(regex.intent_key))
    event = `linked topic request from ${adapter_type}`
  else if(client_message.text.match(regex.topic_page)) {
    event = 'topic page rendered'
    client_message.topic = client_message.text.match(regex.topic_page)[1]
  }
  // FB only
  else if(client_message.quick_reply?.payload.match(regex.follow_up)) {
    event = `postback from ${adapter_type}: quick reply button`
    client_message.text = client_message.quick_reply.payload.replace(regex.follow_up, '')
  }
  else if(client_message.text?.match(regex.card_button)) {
    event = `postback from ${adapter_type}: card button`
    client_message.text = client_message.text.replace(regex.card_button, '')
  }
  //
  else event = `message from ${adapter_type} user`
  bus.emit(event, {
    bot,
    user_message: client_message
  })
}


botkit.on('message', message_and_postback_handler)
botkit.on('facebook_postback', message_and_postback_handler)
