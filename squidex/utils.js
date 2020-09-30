const linkify = question => question?.replace(/ /g, '-')
  .replace(/[?'"%‘’,()“”/\\.–\n:#]/g, '')
  .replace(/--+/g, '-')
  .toLowerCase()


const topic_map = ({ id, data, lastModified }) => {
  const { intentKey, name, exampleQuestions, answer,
          source, buttonLabel, linkedTopics } = data
  const first_example_question = exampleQuestions.iv[0]?.question
  return {
    id,
    intent_key: intentKey?.iv,
    name: name.iv,
    question: first_example_question,
    link: linkify(first_example_question),
    answer: answer?.iv,
    source: source?.iv,
    button_label: buttonLabel?.iv,
    linked_topics: linkedTopics?.iv,
    lastModified
  }
}

// hydrate an array of linked topic ids, or update already-hydrated list
const link_up_topics = _topics => _topics.map(topic1 => {
  topic1.linked_topics =
    topic1.linked_topics?.map(
      linked_topic => _topics.find(topic2 => linked_topic === topic2.id || linked_topic?.id === topic2.id)
    )
  return topic1
})


module.exports = {
  linkify,
  topic_map,
  link_up_topics
}