const {
  ngrok_subdomain,
  ngrok_authtoken,
  PORT
} = process.env

if(ngrok_subdomain && ngrok_authtoken) {
  ngrok = require('ngrok')

  bus = require('../event_bus')
  const { emit_error } = require('../helpers')
  
  ngrok
    .connect({
      authtoken: ngrok_authtoken,
      subdomain: ngrok_subdomain,
      addr: PORT || 3000
    })
    .then(url => bus.emit(`STARTUP: Webhook available at ${url}/api/facebook`))
    .catch(emit_error)  
}