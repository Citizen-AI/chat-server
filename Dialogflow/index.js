'use strict'
// connects to Dialogflow agent

const bus = require('../event_bus')
const { df_query } = require('./df_api_v2')
const { adapter_name, regex } = require ('../helpers')
const { inc_fallback, reset_fallback } = require('./storage')


const { fallbacks_before_fail_message } = process.env


const send_to_df = async payload => {
  const { bot, user_message: { text, reference, user } } = payload
  const adapter_type = adapter_name(bot)

  let query
  if(text?.length > 255) {
    query = 'USER_TEXT_TOO_LONG_INTENT'
    bus.emit('too-long message from user')
  }
  else query = text

  const df_result = await df_query({ query, session_id: user })
    .catch(err => { bus.emit(`Error: Dialogflow: ${err}:`, err.stack) })

  const fallbacks = df_result?.intent?.displayName.match(regex.fallback_intent_name) ?
    inc_fallback(user) : reset_fallback(user)

  await bot.changeContext(reference)
  if(fallbacks_before_fail_message && fallbacks >= fallbacks_before_fail_message)
    bus.emit(`too many fallbacks in a row for ${adapter_type}`, { ...payload, df_result })
  else
    bus.emit(`message from Dialogflow for ${adapter_type}`, { ...payload, df_result })

  if(df_result.parameters?.fields?.feedback?.stringValue?.length)
  bus.emit('user feedback received', {
    user_id: user,
    feedback: df_result.parameters.fields.feedback.stringValue
  })
}



  // # switch
  // #   when not response_wellformed df_result
  // #     bus.emit 'error: message from dialogflow is malformed', "Message text: #{user_message.message.text}"
  // #   else
  // #     bus.emit 'message from dialogflow', {
  // #       user_message
  // #       df_result
  // #       bot
  // #       web_chat_messages
  // #       # df_session: fb_message.sender.id
  // #     }
  // # switch
  // #   when df_result.action?.match /Interviewuser\..*/
  // #     bus.emit 'message from user: user_type interview', {
  // #       user_type: df_result.action.match(/Interviewuser\.(.*)/)[1]
  // #       fb_message
  // #     }



module.exports = {
  send_to_df
}
