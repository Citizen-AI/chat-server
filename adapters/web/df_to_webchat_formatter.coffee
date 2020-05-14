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
  has_cards_before_more,
  has_image_before_more
} = require '../shared'

# pure FB templates (knowing nothing about DF's or Rentbot's APIs)
quick_replies_template = require '../templates/quick_replies'
generic_template = require './templates/generic_template'
button_template_attachment = require './templates/button_template_attachment'
postback_button = require './templates/postback_button'

# less pure templates
follow_up_button = require '../web/templates/follow_up_button'
image_reply_template = require './templates/image_reply'


# these functions translate between dialoglow-style message types, and the webchat-client API

image_reply_df_native = (df_message) ->
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
      payload: payload

# --- #


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
        map_query = map_url[2].match(/.*search\/(.*)/)[1]
        map: true
        payload: map_query
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


split_text_by_more = (text) ->
  more_position = text.search /\[more\] ?/i
  if more_position is -1                 # message with no '[more]'
    reply_text = text
  else if more_position isnt -1                   # message with '[more]'
    reply_text = text.substring 0, more_position
    overflow = text.substring reply_text.length + 6
  reply_text: reply_text
  overflow: overflow


text_reply = (df_speech) ->
  sources_prep = (x) ->
    source: true
    contents: x[1]

  split_text = split_text_by_more df_speech
  button_tags = split_text.reply_text.match regex.button_tag
  sources_tags = split_text.reply_text.match regex.sources_tag
  if not button_tags \
    and not sources_tags \
    and not split_text.overflow
    df_speech
  else
    buttons = []
    if button_tags then buttons = buttons_prep button_tags
    if sources_tags then buttons.push sources_prep sources_tags
    if split_text.overflow
      buttons.push postback_button
        title: 'Tell me more…'
        payload: 'TELL_ME_MORE:' + split_text.overflow
    button_template_attachment
      title: split_text.reply_text.replace(regex.button_tag, '').replace(regex.sources_tag, '')
      buttons: buttons


follow_up_reply = (text) ->
  [, label, payload] = text.match regex.follow_up_tag
  rest_of_line = text.replace(regex.follow_up_tag, '').trim()
  if rest_of_line
    [
      text_reply rest_of_line
      follow_up_button { label, payload }
    ]
  else
    follow_up_button { label, payload }


quick_replies_reply = (text) ->
  [, qr_tag_contents] = text.match regex.quick_replies_tag
  rest_of_line = text
    .replace regex.quick_replies_tag, ''
    .trim()
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


image_reply = (text) ->
  [, url] = text.match regex.image_tag
  rest_of_line = text.replace(regex.image_tag, '').trim()
  if rest_of_line
    [
      text_reply rest_of_line
      image_reply_template url
    ]
  else
    image_reply_template url


text_processor = (text) ->
  cleaned_speech = remove_extra_whitespace text
  lines = remove_empties \    # to get rid of removed source lines
          split_on_newlines_before_more cleaned_speech
  lines.flatMap (line) ->
    switch
      when has_followup_before_more line  then follow_up_reply line
      when has_qr_before_more line        then quick_replies_reply line
      when has_cards_before_more line     then cards_reply line
      when has_image_before_more line     then image_reply line
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


dialogflow_format = (df_result) ->
  df_messages = df_result.fulfillmentMessages
  unique_df_messages = _.uniqWith(df_messages, (a, b) -> a.text?.text[0]?) # I don't understand why this works
  unique_df_messages.flatMap (df_message) ->
    switch
      when df_message.text? then            text_processor df_message.text.text[0]
      when df_message.card? then            card_reply df_message
      when df_message.quickReplies? then    quick_replies_reply_df_native df_message
      when df_message.image? then           image_reply_df_native df_message
      else
        bus.emit 'error: message from dialogflow with unknown type', "Message: #{df_message}"


# surely could be prettier
squidex_format = (topic) ->
  messages = text_processor topic.answer
  if topic.source?
    source_button = source: true, contents: topic.source
    if messages[messages.length - 1].buttons?
      messages[messages.length - 1].buttons.push source_button
    else
      messages[messages.length - 1] =
        text: messages[messages.length - 1]
        buttons: [source_button]
  messages


module.exports = {
  dialogflow_format
  squidex_format
}
