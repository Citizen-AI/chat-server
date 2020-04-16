'use strict'

const { controller, webserver } = require('../../Botkit/botkit')
const bus = require('../../event_bus')


controller.ready(() => {
  controller.publicFolder('/', __dirname  + '/public/')
  bus.emit('STARTUP: web client live at http://localhost:3000')

  webserver.get('/toot', (req, res) => res.send('hello world'))
})
