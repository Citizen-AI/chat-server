'use strict'

const _ = require('lodash')

const { controller } = require('../Botkit/botkit')
const { squidex_items } = require('./squidex_api')
const { find, map } = require('../helpers')
const webhook_handler = require('./webhook_handler')
const { linkify, topic_map, link_up_topics } = require('./utils')


const topics = squidex_items('topic')
  .then(items =>
    link_up_topics(items.map(topic_map))
      .filter(({ intent_key }) => intent_key != '')
  )


const no_metas_or_small_talk = ({ name }) => !name.match(/\[(Meta|Small talk)\]/i)
const has_question = ({ question }) => question


const display_topics = topics
  .then(_topics => _topics
    .filter(no_metas_or_small_talk)
    .filter(has_question)
  )


const get_topic_by_field = (key, value) => topics.then(find(key, value))
  .catch(error => bus.emit(`Error: ${error}`, error.stack))


// extra linkify here to make it a bit more fault-tolerant
const get_topic_by_link = link => topics
  .then(find('link', linkify(link)))
  .catch(error => bus.emit(`Error: ${error}`, error.stack))


const topic_index = display_topics.then(map(({ question, link }) => ({ question, link })))


controller.ready(() => webhook_handler(topics))


module.exports = {
  get_topic_by_link,
  get_topic_by_field,
  topic_index,
  display_topics
}

