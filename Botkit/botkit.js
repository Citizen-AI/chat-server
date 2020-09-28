'use strict'
// Based on https://github.com/howdyai/botkit/blob/62ab6d428e2bb9eec6005b7b5d216b8a60af99b6/packages/testbot/multiadapter.js

const { Botkit } = require('botkit')
const { WebAdapter } = require('botbuilder-adapter-web')
const { FacebookAdapter, FacebookEventTypeMiddleware } = require('botbuilder-adapter-facebook')

require('./ngrok')
const bus = require('../event_bus')


const {
  fb_verify_token,
  fb_page_token,
  fb_app_secret,
  NODE_ENV
} = process.env
const messenger_endpoint = '/api/facebook'
const web_endpoint = '/api/messages'

const web_adapter = new WebAdapter()
const controller = new Botkit({
  debug: NODE_ENV === 'development',
  webhook_uri: web_endpoint,
  disable_console: true
})


controller.ready(() => {
  // bind websocket to the webserver
  web_adapter.createSocketServer(controller.http, {}, controller.handleTurn.bind(controller))

  bus.emit(`STARTUP: Web endpoint online at http://localhost:${controller.http.address().port+web_endpoint}`)

  controller.webserver.get(messenger_endpoint, (req, res) => {
    if(req.query['hub.mode'] === 'subscribe') {
      if(req.query['hub.verify_token'] === fb_verify_token) {
        res.send(req.query['hub.challenge'])
        bus.emit('Responded to Messenger webhook challenge')
      } else {
        res.send('OK')
      }
    }
  })
})


if(fb_verify_token && fb_page_token && fb_app_secret) {
  const facebook_adapter = new FacebookAdapter({
    verify_token: fb_verify_token,
    access_token: fb_page_token,
    app_secret: fb_app_secret,
    validate_requests: true,
    receive_via_postback: true
  })
  facebook_adapter.use(new FacebookEventTypeMiddleware())
  controller.ready(() => {
    bus.emit(`STARTUP: Messenger endpoint online at http://localhost:${controller.http.address().port+messenger_endpoint}`)
    controller.webserver.post(messenger_endpoint, (req, res) =>
      facebook_adapter
        .processActivity(req, res, controller.handleTurn.bind(controller))
        .catch(error => bus.emit('Error: (check your fb_app_secret) ', error.stack))
    )
  })
}


module.exports = {
  controller,
  webserver: controller.webserver
}