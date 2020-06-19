'use strict'

const bus = require('../../event_bus')
const { send_typing } = require('./facebook_api')
const { dialogflow_format, squidex_format, text_processor } = require('./df_to_messenger_formatter')
const {
  ms_delay,
  intent_key_from_df_result,
  find_in_object,
  replace_in_object
} = require('../shared')
const { get_topic_by_intent_key } = require('../../squidex')
const { regex } = require('../../helpers')
const { User, update_user } = require('../../logger/db')


const swap_in_user_name = (user_message, messages_to_send) => new Promise(async resolve => {
  const fb_user_id = user_message.user
  if(!find_in_object(messages_to_send, '#generic.fb_first_name')) {
    resolve(messages_to_send)
  } else {
    bus.emit('Looking up username in storage')
    const user = await User.findOne({ id: fb_user_id })
    let first_name
    if(!user?.fb_user_profile?.first_name) {
      bus.emit('Asking Facebook for user name')
      const fb_user_profile = await get_facebook_profile(fb_user_id)
      // this should catch errors
      update_user(fb_user_id, { fb_user_profile })
      first_name = fb_user_profile.first_name
    } else {
      bus.emit('Found user name in db')
      first_name = user.fb_user_profile.first_name
    }
    resolve(replace_in_object(messages_to_send, '#generic.fb_first_name', first_name))
  }
})


const send_queue = async payload => {
  const { bot, messages_to_send, user_message } = payload
  const messages_to_send_decorated = await swap_in_user_name(user_message, messages_to_send)
  await bot.changeContext(user_message.reference)
  send_typing(user_message)

  let cumulative_wait = 10
  messages_to_send_decorated.forEach((m, i) => {
    (function(m) {
      var next_message_delay, typing_delay
      setTimeout(async () => {
        await bot.changeContext(user_message.reference)
        bot.reply(user_message, m)
        bus.emit('message to Facebook Adapter user', {
          user_message,
          message: m,
          bot
        })
      }, cumulative_wait)
      if(i < messages_to_send_decorated.length - 1) {
        next_message_delay = ms_delay(m)
        typing_delay = cumulative_wait + (next_message_delay * 0.75)
        setTimeout(async () => {
          await bot.changeContext(user_message.reference)
          send_typing(user_message)
        }, typing_delay)
      }
    })(m)
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
  const intent_key = user_message.quick_reply?.payload.match(regex.intent_key)[1]
  const topic = await get_topic_by_intent_key(intent_key)
  const messages_to_send = squidex_format(topic)
  send_queue({
    ...payload,
    messages_to_send
  })
}


// check_user_type = ({ fb_message, bot }) ->
//   user = await User.findOne _id: fb_message.user
//   if user?.user_type?
//     bus.emit 'user returns with type set', {
//       fb_message
//       bot
//       user_type: user.user_type
//       df_session: fb_message.sender.id
//     }
//   else
//     bus.emit 'user with unknown type starts', { fb_message, bot }


// store_user_type = ({ user_type, fb_message }) ->
//   update_user fb_message.user, user_type: user_type
//     .then () -> bus.emit 'Saved user type to db'
//     .catch emit_error


// check_session = ({ fb_message, df_response, bot, df_session }) ->
//   user = await User.findOne _id: fb_message.user
//   if user?.last_session_id is df_session
//     return
//   if user?.last_session_id isnt df_session
//     bus.emit 'putting session in db'
//     update_user fb_message.user, { last_session_id: df_session }
//       .catch emit_error
//     bus.emit 'user session changed', {
//       fb_message
//       bot
//       user_type: user?.user_type
//       fb_first_name: user?.fb_user_profile?.first_name
//       df_session
//       df_response
//     }





module.exports = {
  regular_message,
  tell_me_more,
  linked_topic
//   check_user_type,
//   check_session,
//   store_user_type
}
