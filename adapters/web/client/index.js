'use strict'

const express = require('express')
const exphbs = require('express-handlebars')
const path = require('path')
const slashes = require('connect-slashes')

const { controller, webserver } = require('../../../Botkit/botkit')
const bus = require('../../../event_bus')
const { topic_index, get_topic_by_link, category } = require('../../../squidex')
const { squidex_format } = require('../../web/df_to_webchat_formatter')



const { web_client_config } = process.env
const config = JSON.parse(web_client_config)

webserver.use(express.static(path.join(__dirname, 'public')))
webserver.engine('handlebars', exphbs({ layoutsDir: __dirname + '/views/layouts' }))
webserver.set('view engine', 'handlebars')
webserver.set('views', __dirname + '/views')
webserver.use(slashes(false))


controller.ready(() => {
  const server = 'http://localhost:' + controller.http.address().port
  bus.emit(`STARTUP: Web client online at ${server}/chat`)
  topic_index.then(() => bus.emit(`STARTUP: Answers online at ${server}/answers`))
  const context = {
    ...config,
    meta: () => config.theme_dir + '_meta',
    sidebar: () => config.theme_dir + '_sidebar'
  }

  const topic_page = async (req, res) => {
    const topic = await get_topic_by_link(req.params.topic)
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
    res.render('home', {
      ...context,
      scroll_q: 'noscroll',
      data,
      json_ld
    })
  }

  webserver
    .get('/', (req, res) => res.redirect('/chat'))
    .get('/chat', (req, res) => res.render('home', { ...context }))
    .get('/answers', async (req, res) => res.render('answers', {
      ...context,
      topics: await topic_index
    }))
    .get('/answers/category/:category', async (req, res) => res.render('catgory', {
      ...context,
      topics: await category(req.params.category)
    }))
    .get('/answers/:topic', topic_page)
})
