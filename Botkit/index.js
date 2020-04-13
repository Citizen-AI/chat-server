const bus = require('../event_bus')
const botkit = require('./botkit')


botkit.on('message', async (bot, user_message) => {
  const adapter_type = bot.getConfig('context').adapter.name

  bus.emit(`message from ${adapter_type} user`, {
    bot,
    user_message,
    adapter_type
  })

  // event = switch
  //   when (user_message.text.match regex.get_started) or (user_message.text.match regex.welcome_back)
  //     'web user starts'
  //   when user_message.text.match regex.tell_me_more
  //     'postback: tell me more'
  //   else 
  //     'message from web user'
  // bus.emit event, { user_message, bot }
})