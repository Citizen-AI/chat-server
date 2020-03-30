// Based on https://github.com/howdyai/botkit/blob/62ab6d428e2bb9eec6005b7b5d216b8a60af99b6/packages/testbot/multiadapter.js

const { Botkit } = require('botkit')
const { WebAdapter } = require('botbuilder-adapter-web')
const { FacebookAdapter, FacebookEventTypeMiddleware } = require('botbuilder-adapter-facebook')

require('./ngrok')


const {
  fb_verify_token,
  fb_page_token,
  fb_app_secret,
  NODE_ENV
} = process.env

const web_adapter = new WebAdapter({})

const facebook_adapter = new FacebookAdapter({
    verify_token: fb_verify_token,
    access_token: fb_page_token,
    app_secret: fb_app_secret,
    validate_requests: true,
    receive_via_postback: true
      // app_id: process.env.FACEBOOK_APP_ID,
})

facebook_adapter.use(new FacebookEventTypeMiddleware())


const controller = new Botkit({
    debug: NODE_ENV === 'development',
    webhook_uri: '/api/messages',
    // webserver_middlewares: [(req, res, next) => { console.log('REQ > ', req.url); next(); }]
})

controller.ready(() => {
    // Maybe later
    // // Make the web chat work 
    // // make the web chat available at http://localhost:3000
    // controller.publicFolder('/',__dirname  + '/public');
    // bind websocket to the webserver
    web_adapter.createSocketServer(controller.http, {}, controller.handleTurn.bind(controller))


    // Make the Facebook adapter work
    // we do this by creating a SECOND webhook endpoint
    // and calling the facebook_adapter directly as below.
    // this is what Botkit does internally, see:
    // https://github.com/howdyai/botkit/blob/master/packages/botkit/src/core.ts#L675
    controller.webserver.post('/facebook/receive', (req, res) => {
      console.log('heard something on /facebook/receive')
        facebook_adapter.processActivity(req, res, controller.handleTurn.bind(controller)).catch((err) => {
            console.error('Experienced an error inside the turn handler', err);
            throw err;
        })
    })
})




module.exports = controller