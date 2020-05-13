const { ngrok_subdomain, ngrok_authtoken, PORT } = process.env

if(!ngrok_subdomain && !ngrok_authtoken) return


ngrok = require('ngrok')

bus = require('../event_bus')


ngrok
  .connect({ authtoken: ngrok_authtoken, subdomain: ngrok_subdomain, addr: PORT || 3000 })
  .then(url => bus.emit(`STARTUP: Messenger endpoint online at ${url}/api/facebook`))
  .catch(console.error)
