'use strict'

const express = require('express')
const exphbs = require('express-handlebars')
const path = require('path')
const slashes = require('connect-slashes')

const { controller, webserver } = require('../../../Botkit/botkit')
const bus = require('../../../event_bus')
const { topic_index, category } = require('../../../squidex')
const topic_page = require('./controllers/topic_page')


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
    .get('/answers/:topic', topic_page(context))
})
