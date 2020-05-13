'use strict'


const split_on_newlines_before_more = text => {
  const more_position = text.search(/\[more\]/i)
  if(more_position != -1) {
    const text_before_more = text.substring(0, more_position)
    const lines_before_more = text_before_more.split(/\n/)
    const text_after_more = text.substring(more_position)
    lines_before_more[lines_before_more.length - 1] += text_after_more
    return lines_before_more
  }
  else {
    return text.split(/\n/)
  }
}


const ms_delay = message => {
  const ms = process.env.delay_ms || 25
  let delay
  if(typeof(message) == 'string')
    delay = message.length * ms
  else if(message.attachment?.payload?.text)
    delay = message.attachment.payload.text.length * ms
  else
    3000

  if(delay < 1000) delay = 1000
  return delay
}


const fudge_user_name = messages_to_send =>
  JSON.parse(JSON.stringify(messages_to_send).replace(/#generic.fb_first_name/g, 'there'))


const intent_key_from_df_result = df_result => df_result.intent?.name.match(/.*\/(.*?)$/)?.[1]


module.exports = {
  split_on_newlines_before_more,
  ms_delay,
  fudge_user_name,
  intent_key_from_df_result
}