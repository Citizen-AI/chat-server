require('coffeescript/register')

require('./env')
const bus = require('./event_bus')
const fb = require('./FBMessenger')
const df = require('./Dialogflow')
const web = require('./web')
const logger = require('./logger')
require('./Botkit')

bus
  .on('Web Adapter user starts', df.send_to_df)                       // events from web client
  .on('Web Adapter user starts', logger.user_starts)
  .on('message from Web Adapter user', df.send_to_df)
  .on('message from Web Adapter user', logger.from_web)
  .on('message from Facebook Adapter user', df.send_to_df)
  .on('postback from Web Adapter: tell me more', web.tell_me_more)
  .on('postback from Web Adapter: tell me more', logger.from_web)

  .on('message from Dialogflow for Web Adapter', web.send_queue)      // events from Dialogflow
  .on('message from Dialogflow for Facebook Adapter', fb.send_queue)      // events from Dialogflow
  .on('message from Dialogflow for Web Adapter', logger.from_df)
 
  .on('user feedback received', logger.feedback)

  .on('message to Web Adapter user', logger.to_web)

//   .on('message from Facebook Adapter user', df.process_fb_message)          // events from FB Messenger client
