'use strict'

const bus = require('../event_bus')
const { format, msec_delay } = require('./df_to_webchat_formatter')


const tell_me_more = ({ user_message, bot }) => {
  const tell_me_more_content = user_message.text.match(/^tell_me_more: ?([\s\S]*)/i)
  if(tell_me_more_content.length > 0) {
    const web_chat_messages = format([ { text: { text: [ tell_me_more_content ] } } ] )
    send_queue({
      web_chat_messages,
      user_message,
      bot
    })
  }
}


// const fudge_user_name = web_chat_messages =>
//   JSON.parse(JSON.stringify(web_chat_messages).replace(/#generic.fb_first_name/g, 'there'))


const send_queue = ({ df_result, user_message, bot }) => {
  const web_chat_messages = format(df_result.fulfillmentMessages)

  bot.reply(user_message, { "type": "typing" })
  // web_chat_messages = fudge_user_name(web_chat_messages)

  const cumulative_wait = 500
  web_chat_messages.forEach((m, i) => {
    (function(m, cumulative_wait) {
      var next_message_delay, typing_delay
      setTimeout(() => {
        await(bot.changeContext(user_message.reference))
        bot.reply(user_message, m)
        bus.emit('message to web user', {
          user_message,
          message: m
        })
      }, cumulative_wait)
      if(i < web_chat_messages.length - 1) {
        next_message_delay = msec_delay(m)
        typing_delay = cumulative_wait + (next_message_delay * 0.75)
        setTimeout(() => { bot.reply(user_message, { "type": "typing" }) }, typing_delay)
      }
    })(m, cumulative_wait)
    cumulative_wait += msec_delay(m)
  })
}


module.exports = {
  send_queue,
  tell_me_more
}