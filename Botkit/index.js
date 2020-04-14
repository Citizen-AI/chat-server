const bus = require('../event_bus')
const botkit = require('./botkit')
const { regex } = require('../helpers')


botkit.on('message', async (bot, user_message) => {
  const adapter_type = bot.getConfig('context').adapter.name

  let event
  if(user_message.text.match(regex.get_started) || user_message.text.match(regex.welcome_back))
    event = `${adapter_type} user starts`
  else if(user_message.text.match(regex.tell_me_more))
    event = `postback from ${adapter_type}: tell me more`
  else
    event = `message from ${adapter_type} user`

  bus.emit(event, {
    bot,
    user_message,
    adapter_type
  })
})