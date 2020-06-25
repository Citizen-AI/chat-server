const got = require('got')

const bus = require('../event_bus')


const { squidex_endpoint, squidex_client_id, squidex_client_secret } = process.env
const squidex_identity_endpoint = 'https://cloud.squidex.io/identity-server/connect/token'


const get_token = new Promise((resolve, reject) => {
  got
    .post(squidex_identity_endpoint, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
     body: `grant_type=client_credentials&client_id=${squidex_client_id}&client_secret=${squidex_client_secret}&scope=squidex-api`
   })
   .then(response => resolve(JSON.parse(response.body).access_token))
   .catch(reject)
})


const squidex_items = new Promise(async (resolve, reject) => {
  const squidex_token = await get_token
  got
    .get(squidex_endpoint, {
      headers: { Authorization: 'Bearer ' + squidex_token },
      timeout: 4000
    })
   .catch(reject)
   .then(response => {
     bus.emit(`STARTUP: Collected topics from Squidex endpoint ${squidex_endpoint}`)
     resolve(JSON.parse(response.body).items)
   })
})


module.exports = {
  squidex_items
}