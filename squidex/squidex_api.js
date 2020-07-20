const got = require('got')

const bus = require('../event_bus')


const { squidex_endpoint, squidex_client_id, squidex_client_secret } = process.env
const squidex_identity_endpoint = 'https://cloud.squidex.io/identity-server/connect/token'


const get_token = new Promise(resolve =>
  got
    .post(squidex_identity_endpoint, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
     body: `grant_type=client_credentials&client_id=${squidex_client_id}&client_secret=${squidex_client_secret}&scope=squidex-api`
   })
   .then(response => resolve(JSON.parse(response.body).access_token))
   .catch(err => bus.emit('Error: Squidex identity: ', err))
)


const get_page_from_api = (skip=0, schema='topic') => new Promise(async (resolve, reject) => {
  const squidex_token = await get_token
  got
    .get(`${squidex_endpoint}${schema}/?$skip=${skip}`, { headers: { Authorization: 'Bearer ' + squidex_token }, timeout: 4000 })
    .then(response => {
      const { total, items } = JSON.parse(response.body)
      resolve({ total, items})
    })
    .catch(err => bus.emit('Error: While fetching page from Squidex: ', err))
})


const squidex_items = schema => new Promise(async (resolve, reject) => {
  const { total, items } = await get_page_from_api(0, schema).catch(reject)
  let all_items = items
  while (all_items.length < total) {
    const { items } = await get_page_from_api(all_items.length, schema).catch(reject)
    all_items = all_items.concat(items)
  }
  bus.emit(`STARTUP: Collected ${all_items.length} ${schema} items from Squidex endpoint ${squidex_endpoint}`)
  resolve(all_items)
})


module.exports = {
  squidex_items
}