'use strict'

const bus = require('../../event_bus')
const { dialogflow_format, squidex_format, text_processor } = require('./df_to_webchat_formatter')
const { ms_delay, intent_key_from_df_result, replace_in_object } = require('../shared')
const { regex } = require('../../helpers')
const { get_topic_by_intent_key } = require('../../squidex')


const send_queue = async payload => {
  const { bot, messages_to_send, user_message } = payload
  bot.reply(user_message, { "type": "typing" })
  const messages_to_send_decorated = replace_in_object(messages_to_send, /#generic.fb_first_name/g, 'there')

  let cumulative_wait = 0
  messages_to_send_decorated.forEach((m, i) => {
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
      if(i < messages_to_send_decorated.length - 1) {
        next_message_delay = ms_delay(m)
        typing_delay = cumulative_wait + (next_message_delay * 0.75)
        setTimeout(() => { bot.reply(user_message, { "type": "typing" }) }, typing_delay)
      }
    })(m, cumulative_wait)
    cumulative_wait += ms_delay(m)
  })
}


const regular_message = async payload => {
  const { df_result } = payload
  const topic = await get_topic_by_intent_key(intent_key_from_df_result(df_result))
  if(!topic?.answer) bus.emit('No matching squidex content found; falling back to Dialogflow')
  const messages_to_send = topic?.answer ? squidex_format(topic) : dialogflow_format(df_result)
  send_queue({
    ...payload,
    messages_to_send
  })
}


const tell_me_more = payload => {
  const { user_message } = payload
  const tell_me_more_content = user_message.text.match(regex.tell_me_more)?.[1]
  const messages_to_send = text_processor(tell_me_more_content)
  send_queue({
    ...payload,
    messages_to_send
  })
}


const linked_topic = async payload => {
  const { user_message } = payload
  const intent_key = user_message.text.match(regex.intent_key)[1]
  const topic = await get_topic_by_intent_key(intent_key)
  const messages_to_send = squidex_format(topic)
  send_queue({
    ...payload,
    messages_to_send
  })
}


module.exports = {
  regular_message,
  tell_me_more,
  linked_topic
}