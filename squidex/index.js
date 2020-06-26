'use strict'

const fs = require('fs')

const bus = require('../event_bus')
const { controller, webserver } = require('../Botkit/botkit')
const { squidex_items } = require('./squidex_api')


const topic_map = ({ id, data }) => {
  const { intentKey, name, exampleQuestions, answer, source, buttonLabel, linkedTopics } = data
  const linkify = question => question?.replace(/ /g, '-').replace(/[?']/g, '').toLowerCase()

  return {
    id,
    intent_key: intentKey?.iv,
    name: name.iv,
    question: exampleQuestions.iv[0]?.question,
    link: linkify(exampleQuestions.iv[0]?.question),
    answer: answer?.iv,
    source: source?.iv,
    button_label: buttonLabel?.iv,
    linked_topics: linkedTopics?.iv
  }
}

const link_up_topics = ts => ts.map(topic1 => {
  topic1.linked_topics = topic1.linked_topics?.map(id => ts.find(topic2 => topic2.id === id))
  return topic1
})


const items_to_topics = items => {
  const with_intents = topic => topic.intent_key != ''
  const linked_up = link_up_topics(items.map(topic_map))
  return linked_up.filter(with_intents)
}


const topics = squidex_items.then(items_to_topics)


const get_topic_by_intent_key = intent_key => topics
  .then(ts => ts.find(t => t.intent_key == intent_key))
  .catch(console.error)


const get_topic_by_link = link => topics.then(ts => ts.find(t => t.link == link))


const update_topic = async payload => {
  console.log(payload)
  const intent_key = payload.data.intentKey.iv
  const ts = await topics
  const topic_to_update = ts.find(topic => topic.intent_key == intent_key)
  console.log(intent_key)
  console.log(topic_to_update)
  const replacement_topic = topic_map(payload)
  replacement_topic.linked_topics = replacement_topic.linked_topics?.map(id => ts.find(topic2 => topic2.id === id))
  console.log(replacement_topic)
  Object.assign(topic_to_update, replacement_topic)
  bus.emit(`Squidex: updated topic ${payload.data.name.iv}`)
}


const topic_index = topics.then(ts => ts.map(({ question, link }) => ({ question, link })))


controller.ready(() => {
  const handler = async (req, res) => {
    const { body } = req
    const { type, payload } = body
    bus.emit(`Squidex: heard event ${type}`)
    if(type == 'TopicUpdated')
      await update_topic(payload)
        .catch(err => console.error('trouble updating: ', err))
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
