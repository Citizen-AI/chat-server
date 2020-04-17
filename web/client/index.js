'use strict'

const express = require('express')
const exphbs = require('express-handlebars')
const path = require('path')

const { controller, webserver } = require('../../Botkit/botkit')
const bus = require('../../event_bus')


webserver.use(express.static(path.join(__dirname, 'public')))
webserver.engine('handlebars', exphbs({ layoutsDir: __dirname + '/views/layouts' }))
webserver.set('view engine', 'handlebars')
webserver.set('views', __dirname + '/views')


controller.ready(() => {
  // controller.publicFolder('/', __dirname  + '/public/')
  bus.emit('STARTUP: web client live at http://localhost:3000')

  webserver.get('/', (req, res) => res.render('home'))
})
