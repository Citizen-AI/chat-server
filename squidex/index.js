'use strict'

const bus = require('../event_bus')
const { controller, webserver } = require('../Botkit/botkit')
const { squidex_items } = require('./squidex_api')


const topic_map = ({ id, data }) => {
  const { intentKey, name, exampleQuestions, answer, source, buttonLabel, linkedTopics, category } = data
  const linkify = question => question?.replace(/ /g, '-').replace(/[?']/g, '').toLowerCase()
  const first_example_question = exampleQuestions.iv[0]?.question
  return {
    id,
    intent_key: intentKey?.iv,
    name: name.iv,
    question: first_example_question,
    link: linkify(first_example_question),
    answer: answer?.iv,
    source: source?.iv,
    button_label: buttonLabel?.iv,
    linked_topics: linkedTopics?.iv,
    categories: category?.iv
  }
}


const items_to_topics = items => {
  const link_up_topics = _topics => _topics.map(topic1 => {
    topic1.linked_topics = topic1.linked_topics?.map(id => _topics.find(topic2 => topic2.id === id))
    return topic1
  })

  const with_intents = topic => topic.intent_key != ''
  const linked_up = link_up_topics(items.map(topic_map))
  return linked_up.filter(with_intents)
}


const items_to_categories = items => items.map(({ id, data}) => ({
  id,
  name: data.name.iv
}))


const topics = squidex_items('topic').then(items_to_topics)


const categories = squidex_items('category').then(items_to_categories)


const get_topic_by_intent_key = intent_key => topics
  .then(_topics => _topics.find(topic => topic.intent_key == intent_key))
  .catch(console.error)


const get_topic_by_link = link => topics
  .then(_topics => _topics.find(topic => topic.link == link))
  .catch(console.error)


const update_topic = async payload => {
  const intent_key = payload.data.intentKey.iv
  const _topics = await topics
  const topic_to_update = _topics.find(topic => topic.intent_key == intent_key)
  const replacement_topic = topic_map(payload)
  replacement_topic.linked_topics = replacement_topic.linked_topics?.map(id => _topics.find(topic2 => topic2.id === id))
  Object.assign(topic_to_update, replacement_topic)
  bus.emit(`Squidex: updated topic ${payload.data.name.iv}`)
}


const topic_index = topics.then(_topics => {
  const no_metas_or_small_talk = ({ name }) => !name.match(/\[(Meta|Small talk)\]/i)
  const has_question = ({ question }) => question
  return _topics
    .filter(no_metas_or_small_talk)
    .filter(has_question)
    .map(({ question, link }) => ({ question, link }))
})

const category = categories.then(_topics => {

})


// topics.then(_topics => console.log(_topics.map(({ categories }) => ({ categories }))))


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
  topic_index,
  category
}
