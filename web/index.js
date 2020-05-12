'use strict'

const bus = require('../event_bus')
const { format, msec_delay, text_processor } = require('./df_to_webchat_formatter')
const { regex } = require('../helpers')
const { get_topic } = require('../squidex')


const send_queue = async ({ df_result, user_message, bot }) => {
  const fudge_user_name = web_chat_messages =>
    JSON.parse(JSON.stringify(web_chat_messages).replace(/#generic.fb_first_name/g, 'there'))

  const intent_key = df_result.intent?.name.match(/.*\/(.*?)$/)?.[1]
  const topic = await get_topic(intent_key)

  let web_chat_messages = topic?.answer ?
    text_processor(topic.answer) :
    format(df_result.fulfillmentMessages)

  // let web_chat_messages = format(answer)

  bot.reply(user_message, { "type": "typing" })
  web_chat_messages = fudge_user_name(web_chat_messages)

  let cumulative_wait = 0
  web_chat_messages.forEach((m, i) => {
    (function(m, cumulative_wait) {
      var next_message_delay, typing_delay
      setTimeout(async () => {
        await bot.changeContext(user_message.reference)
        bot.reply(user_message, m)
        bus.emit('message to Web Adapter user', {
          user_message,
          message: m,
          bot
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


const tell_me_more = payload => {
  const { user_message } = payload
  const tell_me_more_content = user_message.text.match(regex.tell_me_more)?.[1]
  const fake_df_result = {
    fulfillmentMessages: [ { text: { text: [ tell_me_more_content ] } } ]
  }
  send_queue({ ...payload, df_result: fake_df_result })
}


module.exports = {
  send_queue,
  tell_me_more
}