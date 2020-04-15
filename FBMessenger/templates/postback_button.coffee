# https://developers.facebook.com/docs/messenger-platform/reference/buttons/postback/

module.exports = ({title, payload}) ->
  type: 'postback'
  title: title
  payload: payload
