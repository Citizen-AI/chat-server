'use strict'

const express = require('express')
const exphbs = require('express-handlebars')
const path = require('path')
const slashes = require('connect-slashes')

const { controller, webserver } = require('../../../Botkit/botkit')
const bus = require('../../../event_bus')
const { topic_index, get_topic_by_link } = require('../../../squidex')
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
  bus.emit(`STARTUP: Answers online at ${server}/answers`)
  const context = {
    ...config,
    meta: () => config.theme_dir + '_meta',
    sidebar: () => config.theme_dir + '_sidebar'
  }
  webserver
    .get('/chat', (req, res) => res.render('home', {
      ...context
    }))
    .get('/answers', async (req, res) => res.render('answers', {
      ...context,
      topics: await topic_index
    }))
    .get('/answers/:topic', async (req, res) => {
      const topic = await get_topic_by_link(req.params.topic)
      const { question, source } = topic
      const simple_items_to_objects = item => typeof item === 'object' ? item : { text: item }
      const answer_messages = squidex_format(topic).map(simple_items_to_objects)
      res.render('home', {
        ...context,
        scroll_q: 'noscroll',
        data: JSON.stringify({ question, answer_messages })
      })
    })
})
