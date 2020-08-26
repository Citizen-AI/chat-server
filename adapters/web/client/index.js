'use strict'

const express = require('express')
const exphbs = require('express-handlebars')
const path = require('path')
const slashes = require('connect-slashes')
const { sampleSize } = require('lodash')

const { controller, webserver } = require('../../../Botkit/botkit')
const bus = require('../../../event_bus')
const { topic_index } = require('../../../squidex')
const topic_page = require('./controllers/topic')
const sitemap = require('./sitemap')
const robots = require('./robots')


const { web_client_config } = process.env
const config = JSON.parse(web_client_config)

webserver.use(express.static(path.join(__dirname, 'public')))
webserver.engine('handlebars', exphbs({ layoutsDir: __dirname + '/views/layouts' }))
webserver.set('view engine', 'handlebars')
webserver.set('views', __dirname + '/views')
webserver.use(slashes(false))
webserver.use(sitemap)
webserver.get('/robots.txt', robots)


controller.ready(async () => {
  const _topic_index = await topic_index
  const server = 'http://localhost:' + controller.http.address().port
  bus.emit(`STARTUP: Answers online at ${server}/answers`)
  const context = {
    ...config,
    meta: () => config.theme_dir + '_meta',
    sidebar: () => config.theme_dir + '_sidebar',
    example_questions: () => sampleSize(_topic_index, 5)
  }
  bus.emit(`STARTUP: Web client online at ${server}/chat`)

  webserver
    .get('/', (req, res) => res.redirect('/chat'))
    .get('/chat', (req, res) => res.render('home', { ...context }))
    .get('/answers', (req, res) => res.render('answers', {
      ...context,
      topics: _topic_index
    }))
    .get('/answers/:topic', topic_page(context))
    .use((req, res) => res.status(404).send("Sorry can't find that!"))
})
