'use strict'

const express = require('express')
const exphbs = require('express-handlebars')
const path = require('path')

const { controller, webserver } = require('../../Botkit/botkit')
const bus = require('../../event_bus')


const { web_client_config } = process.env
const config = JSON.parse(web_client_config)

webserver.use(express.static(path.join(__dirname, 'public')))
webserver.engine('handlebars', exphbs({ layoutsDir: __dirname + '/views/layouts' }))
webserver.set('view engine', 'handlebars')
webserver.set('views', __dirname + '/views')


controller.ready(() => {
  bus.emit('STARTUP: web client live at http://localhost:3000')

  webserver.get('/', (req, res) => res.render('home', {
    ...config,
    meta: () => config.theme_dir + '_meta',
    sidebar: () => config.theme_dir + '_sidebar'
  }))
})
