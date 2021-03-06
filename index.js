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
  .on('linked topic request from Web Adapter', web.linked_topic)
  .on('linked topic request from Web Adapter', logger.from_user)

  .on('Facebook Adapter user starts', df.send_to_df)
  .on('Facebook Adapter user starts', logger.user_starts)
  .on('message from Facebook Adapter user', df.send_to_df)
  .on('message from Facebook Adapter user', logger.from_user)
  .on('postback from Facebook Adapter: quick reply button', df.send_to_df)
  .on('postback from Facebook Adapter: card button', df.send_to_df)
  .on('postback from Facebook Adapter: tell me more', fb.tell_me_more)
  .on('postback from Facebook Adapter: tell me more', logger.from_user)
  .on('linked topic request from Facebook Adapter', fb.linked_topic)
  .on('linked topic request from Facebook Adapter', logger.from_user)

  .on('message from Dialogflow for Web Adapter', web.regular_message)
  .on('message from Dialogflow for Facebook Adapter', fb.regular_message)
  .on('too many repeats in a row for Web Adapter', web.bot_fail_message)
  .on('too many repeats in a row for Facebook Adapter', fb.bot_fail_message)
  .on('message from Dialogflow for Web Adapter', logger.from_df)
  .on('message from Dialogflow for Facebook Adapter', logger.from_df)

  .on('message to Web Adapter user', logger.to_user)
  .on('message to Facebook Adapter user', logger.to_user)
  .on('topic page rendered', logger.topic_page_to_user)

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
