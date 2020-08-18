const { get_topic_by_link } = require('../../../../squidex')
const { squidex_format } = require('../../../web/df_to_webchat_formatter')
const bus = require('../../../../event_bus')


module.exports = context => async (req, res) => {
  const topic = await get_topic_by_link(req.params.topic)
  if(topic) {
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
    const { referer } = req.headers
    bus.emit(`Topic page: ${question}`, { referer })
    res.render('home', {
      ...context,
      bot_page_title: `${question} – ${context.bot_name}`,
      scroll_q: 'noscroll',
      data,
      json_ld
    })
  }
  else {
    bus.emit(`Error: Topic page: couldn't find ${req.params.topic}`)
    res.redirect('/')
  }
}