const { get_topic_by_link } = require('../../../../squidex')
const { squidex_format } = require('../../../web/df_to_webchat_formatter')


module.exports = context => async (req, res) => {
  const topic = await get_topic_by_link(req.params.topic)
  const { question } = topic
  const simple_items_to_objects = item => typeof item === 'object' ? item : { text: item }
  const answer_messages = squidex_format(topic).map(simple_items_to_objects)
  const json_ld_answer = answer_messages
    .map(topic => topic.text).reduce((m, acc) => m + "\n" + acc)
  const data = JSON.stringify({ question, answer_messages })
  const json_ld = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [{
      "@type": "Question",
      "name": question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": json_ld_answer
      }
    }]
  })
  res.render('home', {
    ...context,
    scroll_q: 'noscroll',
    data,
    json_ld
  })
}