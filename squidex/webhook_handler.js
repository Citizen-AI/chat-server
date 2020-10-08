const { controller, webserver } = require('../Botkit/botkit')

const bus = require('../event_bus')
const { create_intent, update_intent } = require('../Dialogflow/df_api_v2')
const { update_item } = require('./squidex_api')
const { topic_map, link_up_topics } = require('./utils')


const add_dialogflow_intent = payload => new Promise(async (resolve, reject) => {
  const intent_key = payload.data.intentKey?.iv
  const name = payload.data.name?.iv
  if(intent_key) return reject('topic already has intent key')
  if(!name)      return reject('topic needs a name')
  const new_intent_key = await create_intent({ displayName: name })
    .catch(error => reject(error))
  bus.emit(`Dialogflow: created new intent '${name}' with intent key ${new_intent_key}`)
  resolve(new_intent_key)
})


const update_dialogflow_intent = ({ data, dataOld }) => new Promise(async (resolve, reject) => {
  const intent_key = data.intentKey?.iv
  const name = data.name?.iv
  const old_name = dataOld.name?.iv
  await update_intent({ name: intent_key, displayName: name })
    .catch(reject)
  bus.emit(`Dialogflow: renamed intent '${old_name}' to '${name}'`)
  resolve()
})


const topic_renamed = ({ data, dataOld }) => data.name.iv != dataOld.name.iv


const intent_key_added = ({ data, dataOld }) => data.intentKey?.iv != dataOld.intentKey?.iv


const topic_by_id = (topics, id) => topics.find(topic => topic.id === id)


const server = 'http://localhost:' + controller.http.address().port
bus.emit(`STARTUP: Listening for Squidex changes at ${server}/api/squidex`)


// in-memory store of topics is injected
module.exports = async topics => {
  const _topics = await topics


  const update_local_topic = payload => new Promise(async (resolve, reject) => {
    const { id } = payload
    const name = payload.data.name.iv
    const topic_to_update = topic_by_id(_topics, id)
    if(!topic_to_update)
      return reject(`Can't find topic to update: ${name}`)
    const replacement_topic = topic_map(payload)
    replacement_topic.linked_topics =
      replacement_topic.linked_topics?.map(id => _topics.find(topic2 => topic2.id === id))
    Object.assign(topic_to_update, replacement_topic)
    Object.assign(_topics, link_up_topics(_topics))
    resolve()
  })


  const upsert_local_topic = async payload => {
    const { id } = payload
    const new_topic = topic_map(payload)
    new_topic.linked_topics = new_topic.linked_topics?.map(id => _topics
        .find(topic2 => topic2.id === id)
      )
    const existing_topic = topic_by_id(_topics, id)
    if(existing_topic)
      Object.assign(existing_topic, new_topic)
    else
      _topics.push(new_topic)
  }


  const remove_local_topic = ({ id }) => {
    const topic = topic_by_id(_topics, id)
    if(topic) _topics.splice(_topics.indexOf(topic), 1)
  }


  webserver.post('/api/squidex', async (req, res) => {
    const { body: { type, payload, payload: { id, data } } } = req
    const intent_key = data?.intentKey?.iv
    bus.emit(`Squidex: heard event ${type}`)
    switch(type) {
      case 'TopicUpdated':
        try {
          await update_local_topic(payload)
          bus.emit(`Squidex: updated topic '${data.name.iv}' locally`)
          if(topic_renamed(payload)) {
            await update_dialogflow_intent(payload)
            bus.emit(`Squidex: renamed Dialogflow intent '${intent_key}'`)
          }
          if(intent_key_added(payload)) {
            await update_intent({ name: intent_key, priority: 500000 })
            bus.emit(`Squidex: enabled matching Dialogflow intent ${intent_key}`)
          }
        } catch (error) { bus.emit(`Error: ${error}: `, error.stack) }
        break

      case 'TopicUnpublished':
        try {
          remove_local_topic(payload)
          await update_intent({ name: intent_key, priority: -1 }) // https://cloud.google.com/dialogflow/es/docs/intents-settings#priority
          bus.emit(`Squidex: removed local topic '${data.name.iv}' and disabled matching Dialogflow intent`)
        } catch (error) { bus.emit(`Error: ${error}: `, error.stack) }
        break

      case 'TopicPublished':
        try {
          await upsert_local_topic(payload)
          bus.emit(`Squidex: added local topic '${data.name.iv}'`)
          if(intent_key) {
            await update_intent({ name: intent_key, priority: 500000 })
            bus.emit(`Squidex: enabled matching Dialogflow intent ${intent_key}`)
          }
        } catch (error) { bus.emit(`Error: ${error}: `, error.stack) }
        break

      // assuming that these are all Draft, for now
      case 'TopicCreated':
        try {
          const new_intent_key = await add_dialogflow_intent(payload)
          await update_item({ id, intent_key: new_intent_key })
          bus.emit(`Squidex: updated Squidex topic ${id} with intent key ${new_intent_key}`)
        } catch (error) {
          bus.emit(`Error: ${error}: `, error.stack)
        }
    }
    res.sendStatus(200)
  })
}