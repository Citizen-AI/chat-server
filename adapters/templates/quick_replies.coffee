# https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies/

module.exports = ({ title, replies }) ->
  text: title
  quick_replies:
    replies.map (reply) ->
      content_type: 'text'
      title: reply.title
      payload: if reply.payload? then reply.payload else reply.title
