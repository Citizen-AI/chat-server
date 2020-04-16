'use strict'

const { replace } = require('lodash/fp')


const bus = require('../event_bus')
const { get_facebook_profile, send_typing } = require('./facebook_api')
const {
  fb_messages_text_contains,
  apply_fn_to_fb_messages,
  msec_delay,
  format
} = require('./df_to_messenger_formatter')
const { regex } = require('../helpers')
const { User, update_user } = require('../logger/db')


const send_queue = async ({ df_result, user_message, bot }) => {
  const swap_in_user_name = ({ fb_message, messages_to_send }) => new Promise(async resolve => {
    const fb_user_id = fb_message.user
    if(fb_messages_text_contains(messages_to_send, '#generic.fb_first_name')) {
      bus.emit('Looking up username in storage')
      user = await User.findOne({ _id: fb_user_id })
      let first_name
      if(user?.fb_user_profile?.first_name) {
        bus.emit('Found user name in db')
        ({ first_name } = user.fb_user_profile)
      } else {
        const fb_user = await get_facebook_profile(fb_user_id)
        update_user(fb_user_id, { fb_user_profile: fb_user })
        ({ first_name } = fb_user)
      }
      resolve(apply_fn_to_fb_messages(messages_to_send, replace('#generic.fb_first_name', first_name)))
    }
    else resolve(messages_to_send)
  })

  let messages_to_send = format(df_result.fulfillmentMessages)
  await bot.changeContext(user_message.reference)
  send_typing(user_message)
  // messages_to_send = swap_in_user_name({ messages_to_send, fb_message:user_message })

  let cumulative_wait = 500
  messages_to_send.forEach((m, i) => {
    (function(m, cumulative_wait) {
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
      if(i < messages_to_send.length - 1) {
        next_message_delay = msec_delay(m)
        typing_delay = cumulative_wait + (next_message_delay * 0.75)
        setTimeout(async () => {
          await bot.changeContext(user_message.reference)
          send_typing(user_message)
        }, typing_delay)
      }
    })(m, cumulative_wait)
    cumulative_wait += msec_delay(m)
  })
}


const tell_me_more = ({ user_message, bot }) => {
  const tell_me_more_content = user_message.text.match(regex.tell_me_more)?.[1]
  const fake_df_result = {
    fulfillmentMessages: [ { text: { text: [ tell_me_more_content ] } } ]
  }
  send_queue({
    df_result: fake_df_result,
    user_message,
    bot
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
  send_queue,
  tell_me_more,
//   check_user_type,
//   check_session,
//   store_user_type
}
