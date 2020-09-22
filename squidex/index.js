'use strict'

const _ = require('lodash')

const bus = require('../event_bus')
const { controller, webserver } = require('../Botkit/botkit')
const { squidex_items, update_item } = require('./squidex_api')
const { find, map } = require('../helpers')
const { create_intent } = require('../Dialogflow/df_api_v2')

const linkify = question => question?.replace(/ /g, '-')
  .replace(/[?'"%‘’,()“”/\\.–\n:#]/g, '')
  .replace(/--+/g, '-')
  .toLowerCase()


const topic_map = ({ id, data, lastModified }) => {
  const { intentKey, name, exampleQuestions, answer,
          source, buttonLabel, linkedTopics, category } = data
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
    categories: category?.iv,
    lastModified
  }
}


const items_to_topics = items => {
  const link_up_topics = _topics => _topics.map(topic1 => {
    topic1.linked_topics = topic1.linked_topics?.map(id => _topics
        .find(topic2 => topic2.id === id))
      .filter(({ button_label }) => button_label)
    return topic1
  })

  const with_intents = topic => topic.intent_key != ''
  const linked_up = link_up_topics(items.map(topic_map))
  return linked_up.filter(with_intents)
}


const topics = squidex_items('topic').then(items_to_topics)


const no_metas_or_small_talk = ({ name }) => !name.match(/\[(Meta|Small talk)\]/i)
const has_question = ({ question }) => question


const display_topics = topics
  .then(_topics => _topics
    .filter(no_metas_or_small_talk)
    .filter(has_question)
  )


const get_topic_by_intent_key = intent_key => topics
  .then(find('intent_key', intent_key))
  .catch(console.error)


// extra linkify here to make it a bit more fault-tolerant
const get_topic_by_link = link => topics
  .then(find('link', linkify(link)))
  .catch(console.error)


const topic_index = display_topics.then(map(({ question, link }) => ({ question, link })))


const topics_in_category = category_id => display_topics
  .then(_display_topics => _display_topics
    .filter(({ categories }) => categories.includes(category_id)))


controller.ready(() => {
  const update_topic = payload => new Promise(async (resolve, reject) => {
    const { id } = payload
    const name = payload.data.name.iv
    const _topics = await topics
    const topic_to_update = _topics.find(topic => topic.id === id)
    if(!topic_to_update) reject(`Can't find topic to update: ${name}`)
    const replacement_topic = topic_map(payload)
    replacement_topic.linked_topics = replacement_topic.linked_topics?.map(id => _topics.find(topic2 => topic2.id === id))
    Object.assign(topic_to_update, replacement_topic)
    bus.emit(`Squidex: updated topic '${payload.data.name.iv}'`)
    resolve()
  })

  const add_topic = async payload => {
    const _topics = await topics
    const new_topic = topic_map(payload)
    new_topic.linked_topics = new_topic.linked_topics?.map(id => _topics
        .find(topic2 => topic2.id === id)
      )
      .filter(({ button_label }) => button_label)
    _topics.push(new_topic)
    bus.emit(`Squidex: added topic '${payload.data.name.iv}' to in-memory store`)
  }

  const add_dialogflow_intent = payload => new Promise(async (resolve, reject) => {
    const intent_key = payload.data.intentKey?.iv
    const name = payload.data.name?.iv
    const { id } = payload
    if(intent_key) reject('topic already has intent key')
    if(!name)      reject('topic needs a name')
    const new_intent_key = await create_intent({ displayName: name })
      .catch(reject)
    bus.emit(`Dialogflow: created new intent '${name}' with intent key ${new_intent_key}`)
    await update_item({ id, intent_key: new_intent_key })
      .catch(reject)
    bus.emit(`Squidex: updated topic ${id} with intent key ${new_intent_key}`)
    resolve()
  })

  const server = 'http://localhost:' + controller.http.address().port
  bus.emit(`STARTUP: Listening for Squidex changes at ${server}/api/squidex`)
  webserver.post('/api/squidex', async (req, res) => {
    const { body } = req
    const { type, payload } = body
    bus.emit(`Squidex: heard event ${type}`)
    switch(type) {
      case 'TopicUpdated':
        await update_topic(payload)
          .catch(err => bus.emit('Error: trouble updating: ', err))
        break
      case 'TopicPublished':
        await add_topic(payload)
          .catch(err => bus.emit('Error: trouble adding: ', err))
        break
      case 'TopicCreated':
        await add_topic(payload)
          .catch(err => bus.emit('Error: trouble adding: ', err))
        await add_dialogflow_intent(payload)
          .catch(err => bus.emit('Error: trouble creating linked Dialogflow intent: ', err))
    }
    res.sendStatus(200)
  })
})


module.exports = {
  get_topic_by_intent_key,
  get_topic_by_link,
  topic_index,
  topics_in_category,
  display_topics
}

