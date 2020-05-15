'use strict'

require('./env')

const got = require('got')

const bus = require('./event_bus')


const { squidex_endpoint, squidex_token } = process.env


const response_processor = response => {
  const linkify = question => question.replace(/ /g, '-').replace(/[?']/g, '').toLowerCase()

  const topic_map = item => ({
    intent_key: item.data.intentKey.iv,
    name: item.data.name.iv,
    question: item.data.exampleQuestions.iv[0].question,
    link: linkify(item.data.exampleQuestions.iv[0].question),
    answer: item.data.answer.iv,
    source: item.data.source?.iv
  })

  const with_intents = topic => topic.intent_key != ''

  const body = JSON.parse(response.body)
  const topics = body.items.map(topic_map)

  bus.emit(`STARTUP: Collected topics from Squidex endpoint ${squidex_endpoint}`)
  return topics.filter(with_intents)
}


const topics = got
  .get(squidex_endpoint, { headers: { Authorization: 'Bearer ' + squidex_token } })
  .then(response_processor)


const get_topic = intent_key => topics.then(ts => ts.find(t => t.intent_key == intent_key))


const get_topic_by_link = link => topics.then(ts => ts.find(t => t.link == link))


module.exports = {
  get_topic,
  get_topic_by_link,
  topics
}
