module.exports = ({label, payload}) ->
  text: label
  quick_replies: [
    content_type: 'text'
    title: 'Yes'
    payload: 'FOLLOW_UP:' + payload
  ,
    content_type: 'text'
    title: 'No'
    payload: 'FOLLOW_UP: FU No'
  ]
