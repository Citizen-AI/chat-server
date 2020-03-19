ngrok = require('ngrok')

bus = require('./event_bus')
const { emit_error } = require('./helpers')

const { ngrok_authtoken, ngrok_subdomain, PORT } = process.env

ngrok
  .connect({
    authtoken: ngrok_authtoken,
    subdomain: ngrok_subdomain,
    addr: PORT || 3000
  })
  .then(url => bus.emit(`STARTUP: Webhook available at ${url}/api/facebook`))
  .catch(emit_error)
