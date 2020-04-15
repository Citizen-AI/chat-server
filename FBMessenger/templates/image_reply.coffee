# https://developers.facebook.com/docs/messenger-platform/send-messages#sending_attachments

module.exports = (image_url) ->
  attachment:
    type: 'image'
    payload:
      url: image_url
