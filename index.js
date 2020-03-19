require('coffeescript/register')

require('./env')

bus = require('./event_bus')
fb = require('./FBMessenger')
require('./Botkit')