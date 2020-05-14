# knows everything rentbot needs to know about the FB Messenger api format

_ = require 'lodash'
PNF = require('google-libphonenumber').PhoneNumberFormat
phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance()

bus = require '../../event_bus'
{ regex, remove_empties, Js } = require '../../helpers'
{
  split_on_newlines_before_more,
  ms_delay,
  remove_extra_whitespace,
  has_followup_before_more,
  has_qr_before_more,
  has_cards_before_more
} = require '../shared'


# pure FB templates (knowing nothing about DF's or Rentbot's APIs)
image_reply_template = require './templates/image_reply'
quick_replies_template = require '../templates/quick_replies'
generic_template = require './templates/generic_template'
button_template_attachment = require './templates/button_template_attachment'
postback_button = require './templates/postback_button'

# less pure templates
follow_up_button = require './templates/follow_up_button'


# these functions translate between dialogflow-style message types, and the FB Messenger API

image_reply = (df_message) ->
  image_reply_template df_message.image.imageUri


card_reply = (df_message) ->
  generic_template
    title: df_message.card.title
    subtitle: df_message.card.subtitle
    image_url: df_message.card.imageUri
    buttons: df_message.card.buttons


quick_replies_reply_df_native = (df_message) ->
  quick_replies_template
    title: df_message.quickReplies.title
    replies: df_message.quickReplies.quickReplies.map (reply) ->
      title: reply
      payload: reply


quick_replies_reply_handrolled = (qr_tag_contents) ->
  [title, ...options] = qr_tag_contents.split /; ?/
  quick_replies_template
    title: title
    replies: options.map (option) ->
      [title, payload] = option.split /: ?/
      title: title
      payload: if payload? then "FOLLOW_UP: #{payload}" else "FOLLOW_UP: #{title}"

# --- #


remove_sources_tags = (text) -> text.replace /(\[Sources?.+\])/ig, ''


buttons_prep = (button_tags) ->
  button_tags.flatMap (button_tag) ->
    button_tag = button_tag.replace /\[|\]/g, ''
    (button_tag.split /; ?/).flatMap (button_text) ->
      map_url = button_text.match regex.map_url
      clm_url = button_text.match regex.clm_url
      pdf_url = button_text.match regex.pdf_url
      messenger_url = button_text.match regex.messenger_url
      page_url = button_text.match regex.url
      phone_number = button_text.match regex.phone
      if map_url
        type: 'web_url'
        url: map_url[2]
        title: "📍 #{map_url[1]}"
      else if clm_url
        type: 'web_url'
        url: clm_url[2]
        title: "📖 #{clm_url[1]}"
      else if pdf_url
        type: 'web_url'
        url: pdf_url[2]
        title: "📄 #{pdf_url[1]}"
      else if messenger_url
        type: 'web_url'
        url: messenger_url[2]
        title: "💬 #{messenger_url[1]}"
      else if page_url
        type: 'web_url'
        url: page_url[2]
        title: "🔗 #{page_url[1]}"
      else if phone_number
        parsed_number = phoneUtil.parse phone_number[2], 'NZ'
        international_number = phoneUtil.format parsed_number, PNF.INTERNATIONAL
        type: 'phone_number'
        title: "📞 #{phone_number[1]}"
        payload: international_number
      else
        bus.emit "Error: Badly formatted button instruction in Dialogflow: #{button_text}"


split_text_by_more_and_length = (text) ->
  truncate_to_word = (string, maxLength) ->   # thanks http://stackoverflow.com/a/5454303
    if string.length > maxLength
      truncatedString = string.substring 0, maxLength
      truncatedString
        .substring 0, Math.min truncatedString.length, truncatedString.lastIndexOf ' '
        .concat ' …'
    else
      string

  more_position = text.search /\[more\]/i
  if more_position is -1 and text.length < 600    # short message with no '[more]'
    reply_text = text
  else if more_position isnt -1                   # message with '[more]'
    reply_text = text.substring 0, more_position
    overflow = text.substring reply_text.length + 6, reply_text.length + 985
  else if text.length > 600                       # long message
    reply_text = truncate_to_word text, 600
    overflow = text.substring reply_text.length - 2, reply_text.length + 985
  reply_text: reply_text
  overflow: overflow


text_reply = (df_speech) ->
  split_text = split_text_by_more_and_length df_speech
  button_tags = split_text.reply_text.match regex.button_tag
  if not button_tags and not split_text.overflow
    df_speech
  else
    buttons = []
    if button_tags then buttons = buttons_prep button_tags
    if split_text.overflow
      buttons.push postback_button
        title: 'Tell me more…'
        payload: 'TELL_ME_MORE:' + split_text.overflow
    button_template_attachment
      title: split_text.reply_text.replace(regex.button_tag, '')
      buttons: buttons


quick_replies_reply = (text) ->
  [, qr_tag_contents] = text.match regex.quick_replies_tag
  rest_of_line = text.replace(regex.quick_replies_tag, '').trim()
  if rest_of_line
    [
      text_reply rest_of_line
      quick_replies_reply_handrolled qr_tag_contents
    ]
  else
    quick_replies_reply_handrolled qr_tag_contents


cards_reply = (text) ->
  [, cards_tag_contents] =  text.match regex.cards_tag
  rest_of_line = text.replace(regex.cards_tag, '').trim()

  elements = cards_tag_contents.split /; ?/
  elements = elements.map (element) ->
    [ title_and_subtitle, button_label, button_payload ] = element.split /: ?/
    if title_and_subtitle.match(/(.*)\((.*)\)/)
      [ , title, subtitle ] = title_and_subtitle.match(/(.*)\((.*)\)/)
    else
      [ title, subtitle ] = [ title_and_subtitle, null ]
    {
      title
      subtitle
      button_label
      button_payload
    }
  if rest_of_line
    [
      text_reply rest_of_line
      generic_template elements
    ]
  else
    generic_template elements


text_processor = (text) ->
  cleaned_speech = remove_extra_whitespace remove_sources_tags text
  lines = remove_empties \    # to get rid of removed source lines
          split_on_newlines_before_more cleaned_speech
  lines.flatMap (line) ->
    switch
      when has_followup_before_more line  then follow_up_reply line
      when has_qr_before_more line        then quick_replies_reply line
      when has_cards_before_more line     then cards_reply line
      else                                     text_reply line


search_fb_message_text = (message, term) ->
  if typeof message is 'string'
    message.match term
  else if message.text?
    message.text.match term
  else if message.attachment?.payload?.text?
    message.attachment.payload.text.match term
  else if message.title? # quick replies
    message.title.match term


dialogflow_format = (df_messages) ->
  unique_df_messages = _.uniqWith(df_messages, (a, b) -> a.text?.text[0]?) # I don't understand why this works
  unique_df_messages.flatMap (df_message) ->
    switch
      when df_message.text? then            text_processor df_message.text.text[0]
      when df_message.card? then            card_reply df_message
      when df_message.quickReplies? then    quick_replies_reply_df_native df_message
      when df_message.image? then           image_reply df_message
      else
        bus.emit 'error: message from dialogflow with unknown type', "Message: #{df_message}"


module.exports = {
  dialogflow_format
  # for testing
  text_processor
  cards_reply
}
