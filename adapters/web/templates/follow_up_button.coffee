# webchat style

module.exports = ({label, payload}) ->
  text: label
  quick_replies: [
    content_type: 'text'
    title: 'Yes'
    payload: payload
  ,
    content_type: 'text'
    title: 'No'
    payload: 'Follow up no'
  ]
