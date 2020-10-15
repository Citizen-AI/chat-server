'use strict'
// connects to Dialogflow agent

const bus = require('../event_bus')
const { df_query } = require('./df_api_v2')
const { adapter_name, regex } = require ('../helpers')
const { is_repeated } = require('./storage')


const send_to_df = async payload => {
  const { bot, user_message: { text, reference, user } } = payload
  const adapter_type = adapter_name(bot)

  let query
  if(text?.length > 255) {
    query = 'USER_TEXT_TOO_LONG_INTENT'
    bus.emit(`Error: too-long message from user: ${text}`)
  }
  else query = text

  const df_result = await df_query({ query, session_id: user })
    .catch(err => { bus.emit(`Error: Dialogflow: ${err}:`, err.stack) })

  const intent_name = df_result?.intent?.displayName

  await bot.changeContext(reference)

  if(is_repeated(user, intent_name))
    bus.emit(`too many repeats in a row for ${adapter_type}`, { ...payload, df_result })
  else
    bus.emit(`message from Dialogflow for ${adapter_type}`, { ...payload, df_result })

  if(df_result.parameters?.fields?.feedback?.stringValue?.length)
  bus.emit('user feedback received', {
    user_id: user,
    feedback: df_result.parameters.fields.feedback.stringValue
  })
}


module.exports = {
  send_to_df
}
