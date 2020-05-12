const follow_up_reply = text => {
  [, label, payload] = text.match regex.follow_up_tag
  rest_of_line = text.replace(regex.follow_up_tag, '').trim()
  if rest_of_line
    [
      text_reply rest_of_line
      follow_up_button { label, payload }
    ]
  else
    follow_up_button { label, payload }
}


const text_processor = answer => {
  const strip_out_from_first_more = text => text.replace(/(\[more\][\s\S]*)/i, '')
  const has_followup_before_more = text => strip_out_from_first_more(text).match(regex.follow_up_tag)
  const has_qr_before_more = text => strip_out_from_first_more(text).match(regex.quick_replies_tag)
  const has_cards_before_more = text => strip_out_from_first_more(text).match(regex.cards_tag)
  const remove_extra_whitespace = text => text
    .replace(/[\s]*\n[\s]*/g, '\n')
    .replace(regex.whitespace_around_first_more, '$1')
    .replace(/[\s]*(\[.*?\])/ig, '$1')

  const lines = remove_empties(split_on_newlines_before_more(remove_extra_whitespace(answer)))
  lines.flatMap(line => {
    switch(true) {
      case has_followup_before_more(line):  return follow_up_reply(line)
      case has_qr_before_more(line):        return quick_replies_reply(line)
      case has_cards_before_more(line):     return cards_reply(line)
      default:                              return text_reply(line)
  }})

}





module.exports = {
  text_processor
}


