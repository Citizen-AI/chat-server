mongoose = require 'mongoose'

{ Event, User } = require './db'
{ emit_error } = require '../helpers'


log_event = (obj) ->
  new Event { obj... }
    .save()
    .catch emit_error


module.exports =
  user_starts: ({ user_message }) ->
    User.findOneAndUpdate {
        id: user_message.user
      }, {
        $push: starts: platform: 'web'
        last_platform: 'web'
      }, {
        upsert: true
        setDefaultsOnInsert: true
      }
      .catch emit_error


  from_web: ({ user_message }) ->
    log_event
      user: user_message.user
      event_type: 'from_web'
      user_said: user_message.text
      user_quick_reply: user_message.quick_reply?.payload
      host: user_message.host


  from_df: ({ user_message, df_result, df_session }) ->
    log_event
      event_type: 'from_df'
      user: user_message.user
      user_said: df_result.queryText
      df_session: df_session
      df_messages: df_result.fulfillmentMessages
      df_intent: df_result.intent.displayName
      df_confidence: df_result.intentDetectionConfidence


  to_web: ({ user_message, message }) ->
    log_event
      event_type: 'to_web'
      user: user_message.user
      bot_said: message


  feedback: ({ user_id, feedback }) ->
    User.findOneAndUpdate { id: user_id }, { $push: feedback: feedback: feedback }, upsert: true
      .catch emit_error
