'use strict'

const { regex } = require('../helpers')


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
  const delay = JSON.stringify(message).length * ms
  return delay >= 1000 ? delay : 1000
}


const find_in_object = (obj, find) =>
  JSON.stringify(obj).match(find)


const replace_in_object = (obj, regex_find, replace) =>
  JSON.parse(JSON.stringify(obj).replace(regex_find, replace))


const intent_key_from_df_result = df_result => df_result.intent?.name.match(/.*\/(.*?)$/)?.[1]


const remove_extra_whitespace = text =>
  text
    .replace(/[\s]*\n[\s]*/g, '\n')
    .replace(regex.whitespace_around_first_more, '$1')
    .replace(/[\s]*(\[.*?\])/ig, '$1')


const strip_out_from_first_more = text => text.replace(/(\[more\][\s\S]*)/i, '')
const has_followup_before_more = text => strip_out_from_first_more(text).match(regex.follow_up_tag)
const has_qr_before_more = text => strip_out_from_first_more(text).match(regex.quick_replies_tag)
const has_cards_before_more = text => strip_out_from_first_more(text).match(regex.cards_tag)
const has_image_before_more = text => strip_out_from_first_more(text).match(regex.image_tag)


module.exports = {
  split_on_newlines_before_more,
  ms_delay,
  intent_key_from_df_result,
  remove_extra_whitespace,
  has_followup_before_more,
  has_qr_before_more,
  has_cards_before_more,
  has_image_before_more,
  find_in_object,
  replace_in_object
}