const { controller, webserver } = require('../Botkit/botkit')

const bus = require('../event_bus')
const { create_intent, update_intent } = require('../Dialogflow/df_api_v2')
const { update_item } = require('./squidex_api')
const { topic_map } = require('./utils')


const add_dialogflow_intent = payload => new Promise(async (resolve, reject) => {
  const intent_key = payload.data.intentKey?.iv
  const name = payload.data.name?.iv
  if(intent_key) reject('topic already has intent key')
  if(!name)      reject('topic needs a name')
  try {
    const new_intent_key = await create_intent({ displayName: name })
    bus.emit(`Dialogflow: created new intent '${name}' with intent key ${new_intent_key}`)
    resolve(new_intent_key)
  } catch (error) { reject(error) }
})


const update_dialogflow_intent = payload => new Promise(async (resolve, reject) => {
  const intent_key = payload.data.intentKey?.iv
  const name = payload.data.name?.iv
  const old_name = payload.dataOld.name?.iv
  try {
    await update_intent({ name: intent_key, displayName: name })
    bus.emit(`Dialogflow: renamed intent '${old_name}' to '${name}'`)
    resolve()
  } catch (error) { reject(error) }
})


const topic_renamed = ({ data, dataOld }) => data.name.iv != dataOld.name.iv


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
    replacement_topic.linked_topics = replacement_topic.linked_topics?.map(id => _topics.find(topic2 => topic2.id === id))
    Object.assign(topic_to_update, replacement_topic)
    bus.emit(`Squidex: updated topic '${payload.data.name.iv}' locally`)
    resolve()
  })


  const upsert_local_topic = async payload => {
    const { id } = payload
    const new_topic = topic_map(payload)
    new_topic.linked_topics = new_topic.linked_topics?.map(id => _topics
        .find(topic2 => topic2.id === id)
      )
      .filter(({ button_label }) => button_label)
    const existing_topic = topic_by_id(_topics, id)
    if(existing_topic)
      Object.assign(existing_topic, new_topic)
    else
      _topics.push(new_topic)
    bus.emit(`Squidex: added topic '${payload.data.name.iv}' locally`)
  }


  const remove_local_topic = async ({ id, data }) => {
    const topic = topic_by_id(_topics, id)
    if(topic) {
      _topics.splice(_topics.indexOf(topic), 1)
      bus.emit(`Squidex: removed topic '${data.name.iv}' locally`)
    }
  }


  webserver.post('/api/squidex', async (req, res) => {
    const { body } = req
    const { type, payload } = body
    const { id, status } = payload
    bus.emit(`Squidex: heard event ${type}`)
    switch(type) {
      case 'TopicUpdated':
        try {
          if(status === 'Draft')
            await remove_local_topic(payload)
          else {
            await update_local_topic(payload)
            if(topic_renamed(payload))
              await update_dialogflow_intent(payload)
          }
        } catch (error) { bus.emit('Error: ', error) }
        break

      case 'TopicUnpublished':
        await remove_local_topic(payload)
        break

      case 'TopicCreated':
      case 'TopicPublished':
        if(status === 'Draft')
          bus.emit(`Squidex: draft Squidex topic — ignoring`)
        else {
          try {
            await upsert_local_topic(payload)
            const new_intent_key = await add_dialogflow_intent(payload)
            await update_item({ id, intent_key: new_intent_key })
            bus.emit(`Squidex: updated Squidex topic ${id} with intent key ${new_intent_key}`)
          } catch (error) {
            bus.emit('Error: ', error)
          }
        }
    }
    res.sendStatus(200)
  })
}