const bus = require('../event_bus')
const botkit = require('./botkit')


botkit.on('message', async (bot, message) => {
    const adapter_type = bot.getConfig('context').adapter.name
    await bot.reply(message,`I heard ya on my ${ adapter_type } adapter`)
})
