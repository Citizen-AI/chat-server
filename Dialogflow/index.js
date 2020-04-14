// connects to Dialogflow agent

const bus = require('../event_bus')
const { df_query } = require('./df_api_v2')
const { adapter_name } = require ('../helpers')


// const response_wellformed = df_result => {
//   remove_smiley = text => text.replace(/:\)/, '')
//   df_result.fulfillmentMessages.every (message) ->
//     speech = ''
//     if message.speech? then speech = remove_smiley message.speech
//     balanced = is_balanced speech, '{[(', '}])'
//     more_wrong = speech?.match /\[more:.*\]/i
//     follow_up_right =
//       if speech?.match(/\[FU/i)
//         speech.match /\[FU:.+:.+\]/i
//       else
//         true
//     balanced and not more_wrong and follow_up_right

// }


const send_to_df = async ({ user_message, bot }) => {
  let query
  const adapter_type = adapter_name(bot)

  if(user_message.text?.length > 255) {
    query = 'USER_TEXT_TOO_LONG_INTENT'
    bus.emit('too-long message from user')
  }
  else query = user_message.text

  try {
    df_result = await df_query({
      query: query,
      session_id: user_message.user
    })
  }
  catch(err) { console.error(err) }

  await bot.changeContext(user_message.reference)
  bus.emit(`message from Dialogflow for ${adapter_type}`, {
    bot,
    user_message,
    df_result
  })

  if(df_result.parameters?.fields?.feedback?.stringValue?.length)
    bus.emit('user feedback received', {
      user_id: user_message.user,
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
