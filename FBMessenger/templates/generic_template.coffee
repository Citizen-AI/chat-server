# https://developers.facebook.com/docs/messenger-platform/send-messages/template/generic/


module.exports = (cards) ->
  attachment:
    type: 'template'
    payload:
      template_type: 'generic'
      elements: cards.map (card) ->
        title: card.title
        subtitle: card.subtitle
        buttons: [
          type: 'postback'
          title: card.button_label
          payload: 'CARD_BUTTON:' + card.button_payload
        ]
