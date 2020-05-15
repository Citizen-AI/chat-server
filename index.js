require('coffeescript/register')

require('./env')
const bus = require('./event_bus')
const fb = require('./adapters/FBMessenger')
const web = require('./adapters/web')
require('./adapters/web/client')
const df = require('./Dialogflow')
const logger = require('./logger')
require('./Botkit')


bus
  .on('Web Adapter user starts', df.send_to_df)
  .on('Web Adapter user starts', logger.user_starts)
  .on('message from Web Adapter user', df.send_to_df)
  .on('message from Web Adapter user', logger.from_user)
  .on('postback from Web Adapter: tell me more', web.tell_me_more)
  .on('postback from Web Adapter: tell me more', logger.from_user)
  .on('message to Web Adapter user', logger.to_user)

  .on('Facebook Adapter user starts', df.send_to_df)
  .on('Facebook Adapter user starts', logger.user_starts)
  .on('message from Facebook Adapter user', df.send_to_df)
  .on('message from Facebook Adapter user', logger.from_user)
  .on('postback from Facebook Adapter: quick reply button', df.send_to_df)
  .on('postback from Facebook Adapter: card button', df.send_to_df)
  .on('postback from Facebook Adapter: tell me more', fb.tell_me_more)
  .on('postback from Facebook Adapter: tell me more', logger.from_user)
  .on('message to Facebook Adapter user', logger.to_user)

  .on('message from Dialogflow for Web Adapter', web.send_queue)
  .on('message from Dialogflow for Facebook Adapter', fb.send_queue)
  .on('message from Dialogflow for Web Adapter', logger.from_df)
  .on('message from Dialogflow for Facebook Adapter', logger.from_df)

  .on('user feedback received', logger.feedback)


// bus
// # events from FBMessenger
//   .on 'postback: get started', fb.check_user_type
//   .on 'user session changed', df.set_user_type
//   .on 'user returns with type set', df.set_user_type
//   .on 'user returns with type set', df.welcome_returning_user
//   .on 'user with unknown type starts', df.interview_user

// # events from Dialogflow
//   .on 'message from dialogflow', fb.check_session
//   .on 'message from user: user_type interview', fb.store_user_type
