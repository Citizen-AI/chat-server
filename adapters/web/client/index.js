'use strict'

const express = require('express')
const exphbs = require('express-handlebars')
const path = require('path')
const slashes = require('connect-slashes')

const { controller, webserver } = require('../../../Botkit/botkit')
const bus = require('../../../event_bus')
const { topics, get_topic_by_link } = require('../../../squidex')
const { squidex_format } = require('../../web/df_to_webchat_formatter')


const { web_client_config } = process.env
const config = JSON.parse(web_client_config)

webserver.use(express.static(path.join(__dirname, 'public')))
webserver.engine('handlebars', exphbs({
  layoutsDir: __dirname + '/views/layouts',
  helpers: { squidex_format }
}))
webserver.set('view engine', 'handlebars')
webserver.set('views', __dirname + '/views')
webserver.use(slashes(false))


controller.ready(() => {
  const server = 'http://localhost:' + controller.http.address().port
  bus.emit(`STARTUP: Web client online at ${server}`)
  bus.emit(`STARTUP: Answers online at ${server}/answers`)
  const context = {
    ...config,
    meta: () => config.theme_dir + '_meta',
    sidebar: () => config.theme_dir + '_sidebar'
  }
  webserver
    .get('/', (req, res) => res.render('home', {
      ...context
    }))
    .get('/answers', async (req, res) => res.render('answers', {
      ...context,
      topics: await topics, // should just send names & links
    }))
    .get('/answers/:topic', async (req, res) => res.render('answer', {
      ...context,
      topic: await get_topic_by_link(req.params.topic),
      something: exphbs.compile()
    }))
})
