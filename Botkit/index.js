'use strict'

const bus = require('../event_bus')
const botkit = require('./botkit')
const { regex, adapter_name } = require('../helpers')


const message_and_postback_handler = (bot, user_message) => {
  const adapter_type = adapter_name(bot)
  let event
  if(user_message.text.match(regex.web_get_started) ||
     user_message.text.match(regex.web_welcome_back) ||
     user_message.text.match(regex.fb_get_started))
    event = `${adapter_type} user starts`
  else if(user_message.text.match(regex.tell_me_more))
    event = `postback from ${adapter_type}: tell me more`
  else
    event = `message from ${adapter_type} user`
  bus.emit(event, { bot, user_message })
}


botkit.on('message', message_and_postback_handler)
botkit.on('facebook_postback', message_and_postback_handler)


// botkit.on 'message', (bot, fb_message) ->
//   event = switch
//     when fb_message.quick_reply?.payload.match regex.follow_up then 'quick reply: follow up'
//     else 'message from user'
//   bus.emit event, { fb_message, bot }

// botkit.on 'facebook_postback', (bot, fb_message) ->
//   event = switch
//     when fb_message.text?.match regex.follow_up then 'postback: follow up'
//     when fb_message.text?.match regex.card_button then 'postback: card button'
//   if event
//     bus.emit event, { fb_message, bot }
//   else
//     bus.emit "error: unknown kinda postback: #{fb_message.text}"