# Subset of https://developers.facebook.com/docs/messenger-platform/send-messages/template/generic/


module.exports = (cards) ->
  if not Array.isArray cards then cards = [cards]
  attachment:
    type: 'template'
    payload:
      template_type: 'generic'
      elements: cards.map (card) ->
        title: card.title
        subtitle: card.subtitle
        image_url: card.image_url
        buttons: [
          title: card.button_label
          payload: card.button_payload
        ]
