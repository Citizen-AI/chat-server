const linkify = question => question?.replace(/ /g, '-')
  .replace(/[?'"%‘’,()“”/\\.–\n:#]/g, '')
  .replace(/--+/g, '-')
  .toLowerCase()


const topic_map = ({ id, data, lastModified }) => {
  const { intentKey, name, exampleQuestions, answer,
          source, buttonLabel, linkedTopics, category } = data
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
    categories: category?.iv,
    lastModified
  }
}


module.exports = {
  linkify,
  topic_map
}