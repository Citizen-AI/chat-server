require('coffeescript/register')

require('./env')
const bus = require('./event_bus')
const fb = require('./FBMessenger')
const df = require('./Dialogflow')
const web = require('./web')
const logger = require('./logger')
require('./Botkit')

bus
  .on('Web Adapter user starts', df.send_to_df)
  .on('Web Adapter user starts', logger.user_starts)
  .on('message from Web Adapter user', df.send_to_df)
  .on('message from Web Adapter user', logger.from_web)
  .on('postback from Web Adapter: tell me more', web.tell_me_more)
  .on('postback from Web Adapter: tell me more', logger.from_web)

  .on('message from Facebook Adapter user', df.send_to_df)
  .on('postback from Facebook Adapter: tell me more', fb.tell_me_more)

  .on('message from Dialogflow for Web Adapter', web.send_queue)
  .on('message from Dialogflow for Facebook Adapter', fb.send_queue)
  .on('message from Dialogflow for Web Adapter', logger.from_df)
 
  .on('user feedback received', logger.feedback)

  .on('message to Web Adapter user', logger.to_web)

//   .on('message from Facebook Adapter user', df.process_fb_message)          // events from FB Messenger client


// bus
// # events from FBMessenger
//   .on 'postback: get started', fb.check_user_type
//   .on 'postback: get started', logger.user_starts
//   .on 'message from user', df.process_fb_message
//   .on 'message from user', logger.from_fb
//   .on 'postback: tell me more', fb.tell_me_more
//   .on 'postback: tell me more', logger.from_fb
//   .on 'postback: follow up', df.follow_up
//   .on 'postback: card button', df.card_button
//   .on 'quick reply: follow up', df.qr_follow_up
//   .on 'quick reply: follow up', logger.from_fb
//   .on 'user session changed', df.set_user_type
//   .on 'user returns with type set', df.set_user_type
//   .on 'user returns with type set', df.welcome_returning_user
//   .on 'user with unknown type starts', df.interview_user
//   .on 'user feedback received', logger.feedback

// # events from Dialogflow
//   .on 'message from dialogflow', fb.check_session
//   .on 'message from dialogflow', logger.from_df
//   .on 'message from dialogflow', fb.process_df_response_into_fb_messages
//   .on 'message from user: user_type interview', fb.store_user_type

// # events to FBMessenger
//   .on 'message to user', logger.to_fb
