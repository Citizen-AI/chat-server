'use strict'

const got = require('got')

const bus = require('./event_bus')
const { controller, webserver } = require('./Botkit/botkit')


const { squidex_endpoint, squidex_token } = process.env


const topic_map = item => {
  const linkify = question => question?.replace(/ /g, '-').replace(/[?']/g, '').toLowerCase()

  return {
    intent_key: item.data.intentKey?.iv,
    name: item.data.name.iv,
    question: item.data.exampleQuestions.iv[0]?.question,
    link: linkify(item.data.exampleQuestions.iv[0]?.question),
    answer: item.data.answer.iv,
    source: item.data.source?.iv
  }
}


const response_processor = response => {
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


const update_topic = async (intent_key, payload) => {
  const ts = await topics
  Object.assign(ts.find(t => t.intent_key == intent_key), topic_map(payload))
}


const handler = async (req, res) => {
  const { body } = req
  const { type, payload } = body
  bus.emit(`Squidex: heard event ${type}`)
  if(type == 'TopicsUpdated') {
    await update_topic(payload.data.intentKey.iv, payload)
    bus.emit(`Squidex: updated topic ${payload.data.name.iv}`)
  }
  res.sendStatus(200)
}


controller.ready(() => {
  const server = 'http://localhost:' + controller.http.address().port
  bus.emit(`STARTUP: Listening for Squidex changes at ${server}/api/squidex`)
  webserver.post('/api/squidex', handler)
})



module.exports = {
  get_topic,
  get_topic_by_link,
  update_topic,
  topics
}
