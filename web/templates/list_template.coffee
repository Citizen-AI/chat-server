# https://developers.facebook.com/docs/messenger-platform/reference/template/list
# presently unused


list_template_element = ({title, subtitle, image_url, payload}) ->
  element =
    title: title
    buttons: [
      title: 'Read'
      type: 'postback'
      payload: payload
      webview_height_ratio: 'tall'
    ]
  element.subtitle = subtitle if subtitle?
  element.image_url = image_url if image_url?
  return element


module.exports = (elements) ->
  attachment:
    type: 'template'
    payload:
      template_type: 'list'
      top_element_style: 'compact'
      elements: elements.map list_template_element
