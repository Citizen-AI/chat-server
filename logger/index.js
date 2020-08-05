'use strict'

const mongoose = require('mongoose')

const { Event, User } = require('./db')
const { adapter_name, emit_error } = require('../helpers')


// Thanks https://medium.com/@numberpicture/nugget-javascript-switch-expressions-e3bf059eefb0
const platform = bot => ({
  'Web Adapter': 'web',
  'Facebook Adapter': 'messenger'
})[adapter_name(bot)] || 'unknown'


const log_event = obj =>
  new Event({ ...obj })
    .save()
    .catch(emit_error)


module.exports = {
  user_starts: ({ user_message, bot }) => {
    User
      .findOneAndUpdate(
        { id: user_message.user },
        { $push: { starts: { platform: platform(bot) } }, last_platform: platform(bot) },
        { upsert: true, setDefaultsOnInsert: true }
      )
      .catch(emit_error)
  },

  from_user: ({ user_message, bot }) =>
    log_event({
      user: user_message.user,
      event_type: 'from_' + platform(bot),
      user_said: user_message.text,
      user_quick_reply: user_message.quick_reply?.payload,
      host: user_message.host
    }),


  from_df: ({ user_message, df_result, df_session }) =>
    log_event({
      event_type: 'from_df',
      user: user_message.user,
      user_said: df_result.queryText,
      df_session: df_session,
      df_messages: df_result.fulfillmentMessages,
      df_intent: df_result.intent.displayName,
      df_confidence: df_result.intentDetectionConfidence
    }),


  to_user: ({ user_message, message, bot }) =>
    log_event({
      event_type: 'to_' + platform(bot),
      user: user_message.user,
      bot_said: message
    }),


  topic_page_to_user: ({ user_message }) =>
    log_event({
      event_type: 'topic_page_to_user',
      user: user_message.user,
      topic: user_message.topic
    }),


  feedback: ({ user_id, feedback }) => {
    User.findOneAndUpdate(
      { id: user_id },
      { $push: { feedback: { feedback: feedback } } },
      { upsert: true }
    )
    .catch(emit_error)
  }
}