require('coffeescript/register')

require('./env')
const bus = require('./event_bus')
const fb = require('./FBMessenger')
require('./Botkit')



// bus
//   .on('message from Web Adapter user', df.process_web_message)        // events from web client
//   .on('message from Facebook Adapter user', df.process_fb_message)          // events from FB Messenger client