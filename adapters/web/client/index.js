'use strict'

const express = require('express')
const exphbs = require('express-handlebars')
const path = require('path')
const slashes = require('connect-slashes')

const { controller, webserver } = require('../../../Botkit/botkit')
const bus = require('../../../event_bus')
const { topic_index, category } = require('../../../squidex')
const topic_page = require('./controllers/topic')
const category_page = require('./controllers/category')


const { web_client_config } = process.env
const config = JSON.parse(web_client_config)

webserver.use(express.static(path.join(__dirname, 'public')))
webserver.engine('handlebars', exphbs({ layoutsDir: __dirname + '/views/layouts' }))
webserver.set('view engine', 'handlebars')
webserver.set('views', __dirname + '/views')
webserver.use(slashes(false))


controller.ready(() => {
  const server = 'http://localhost:' + controller.http.address().port
  const context = {
    ...config,
    meta: () => config.theme_dir + '_meta',
    sidebar: () => config.theme_dir + '_sidebar'
  }
  bus.emit(`STARTUP: Web client online at ${server}/chat`)
  topic_index.then(() => bus.emit(`STARTUP: Answers online at ${server}/answers`))

  webserver
    .get('/', (req, res) => res.redirect('/chat'))
    .get('/chat', (req, res) => res.render('home', { ...context }))
    .get('/answers', async (req, res) => res.render('answers', {
      ...context,
      topics: await topic_index
    }))
    .get('/answers/:topic', topic_page(context))
    .get('/answers/category/:category', category_page(context))
    .use((req, res) => res.status(404).send("Sorry can't find that!"))
})
