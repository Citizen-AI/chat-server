require('coffeescript/register')

require('./env')
const bus = require('./event_bus')
// const fb = require('./FBMessenger')
const df = require('./Dialogflow')
const web = require('./web')
require('./Botkit')

bus
  .on('message from Web Adapter user', df.send_to_df)        // events from web client

  .on('message from Dialogflow for Web Adapter', web.send_queue)                             // events from Dialogflow

//   .on('message from Facebook Adapter user', df.process_fb_message)          // events from FB Messenger client