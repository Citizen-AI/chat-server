'use strict'

const _ = require('lodash')

const { controller } = require('../Botkit/botkit')
const { squidex_items } = require('./squidex_api')
const { find, map } = require('../helpers')
const webhook_handler = require('./webhook_handler')
const { linkify, topic_map } = require('./utils')


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


controller.ready(() => webhook_handler(topics))


module.exports = {
  get_topic_by_intent_key,
  get_topic_by_link,
  topic_index,
  topics_in_category,
  display_topics
}

