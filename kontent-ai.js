// https://www.npmjs.com/package/@kentico/kontent-delivery
const KontentDelivery = require('@kentico/kontent-delivery')

const bus = require('./event_bus')


const { kontent_ai_project } = process.env


class Topic extends KontentDelivery.ContentItem {
  constructor() {
    super()
  }
}


const deliveryClient = new KontentDelivery.DeliveryClient({
  projectId: kontent_ai_project,
  typeResolvers: [
    new KontentDelivery.TypeResolver('topic', () => new Topic())
  ]
})


const response_processor = response => {
  const topic_map = topic => ({
    intent_key: topic.intent_key.value,
    answer: topic.answer.value,
    source: topic.source.value
  })

  const topics = response.items.map(topic_map)
  const topics_with_intents = topics.filter(topic => topic.intent_key != '')

  bus.emit(`STARTUP: Collected topics from Kontent.ai project ${kontent_ai_project}`)
  return topics_with_intents
}


const get_topics = deliveryClient.items()
  .type('topic')
  // .equalsFilter('elements.title', 'Cell Confinement and Segregation - When')
  .toPromise()
  .then(response_processor)


const get_topic = intent_key => new Promise(resolve =>
  get_topics.then(topics => resolve(topics.find(t => t.intent_key == intent_key)))
)


// promises
module.exports = {
  get_topic
}


// module.exports.topic('64a29ff9-6508-44b0-86c0-77d1ef8966bb').then(console.log)