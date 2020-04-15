# https://developers.facebook.com/docs/messenger-platform/send-messages/template/button

module.exports = ({title, buttons}) ->
  attachment:
    type: 'template'
    payload:
      template_type: 'button'
      text: title
      buttons: buttons
