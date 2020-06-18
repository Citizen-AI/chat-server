'use strict'

const got = require('got')

const bus = require('./event_bus')
const { controller, webserver } = require('./Botkit/botkit')


const { squidex_endpoint, squidex_client_id, squidex_client_secret } = process.env
const squidex_identity_endpoint = 'https://cloud.squidex.io/identity-server/connect/token'


const get_token = new Promise((resolve, reject) => {
  got
    .post(squidex_identity_endpoint, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
     body: `grant_type=client_credentials&client_id=${squidex_client_id}&client_secret=${squidex_client_secret}&scope=squidex-api`
   })
   .then(response => resolve(JSON.parse(response.body).access_token))
   .catch(reject)
})


const response_processor = response => {
  const topic_map = ({ id, data }) => {
    const { intentKey, name, exampleQuestions, answer, source, buttonLabel, linkedTopics } = data
    const linkify = question => question?.replace(/ /g, '-').replace(/[?']/g, '').toLowerCase()

    return {
      id,
      intent_key: intentKey?.iv,
      name: name.iv,
      question: exampleQuestions.iv[0]?.question,
      link: linkify(exampleQuestions.iv[0]?.question),
      answer: answer.iv,
      source: source?.iv,
      button_label: buttonLabel?.iv,
      linked_topics: linkedTopics?.iv
    }
  }

  const with_intents = topic => topic.intent_key != ''
  const body = JSON.parse(response.body)
  const topics = body.items.map(topic_map)
  const topics_with_links = topics.map(topic => {
    topic.linked_topics = topic.linked_topics?.map(id => topics.find(t => t.id == id))
    return topic
  })
  const topics_with_intents = topics_with_links.filter(with_intents)
  bus.emit(`STARTUP: Collected topics from Squidex endpoint ${squidex_endpoint}`)
  return topics_with_intents
}


const topics = new Promise(async (resolve, reject) => {
  const squidex_token = await get_token
  const response = await got
    .get(squidex_endpoint, {
      headers: { Authorization: 'Bearer ' + squidex_token },
      timeout: 4000
    })
   .catch(reject)
  resolve(response_processor(response))
})


const get_topic_by_intent_key = intent_key => topics
  .then(ts => ts.find(t => t.intent_key == intent_key))
  .catch(console.error)


const get_topic_by_link = link => topics.then(ts => ts.find(t => t.link == link))


const update_topic = async (intent_key, payload) => {
  const ts = await topics
  Object.assign(ts.find(t => t.intent_key == intent_key), topic_map(payload))
}


const topic_index = topics.then(ts => ts.map(({ question, link }) => ({ question, link })))



controller.ready(() => {
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

  const server = 'http://localhost:' + controller.http.address().port
  bus.emit(`STARTUP: Listening for Squidex changes at ${server}/api/squidex`)
  webserver.post('/api/squidex', handler)
})


module.exports = {
  get_topic_by_intent_key,
  get_topic_by_link,
  update_topic,
  topic_index
}
