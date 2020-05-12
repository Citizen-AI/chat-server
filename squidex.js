require('./env')
const got = require('got')
const fs = require('fs')

const bus = require('./event_bus')


const { squidex_endpoint, squidex_token } = process.env


const response_processor = response => {
  const topic_map = item => ({
    intent_key: item.data.intentKey.iv,
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


module.exports = {
  get_topic
}
