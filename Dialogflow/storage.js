'use strict'
/*
In-memory storage to keep track of the last X intents triggered for each user, so that a
graceful fallback message can be sent when there are too many of the same
*/

const { repeated_intents_before_fail_message, fail_message_intent_name } = process.env

const data = {}


const add = (user_id, intent_name) => {
  Array.isArray(data[user_id]) ? data[user_id].push(intent_name) : data[user_id] = [intent_name]
  if(data[user_id].length > repeated_intents_before_fail_message) data[user_id].shift()
}


// Thanks https://stackoverflow.com/a/35568895/1876628
const n_the_same = user_id => {
  const user_data = data[user_id]
  if(!repeated_intents_before_fail_message || !fail_message_intent_name) return false
  if(!user_data) return false
  if(user_data.length < repeated_intents_before_fail_message) return false
  return user_data.every(v => v === user_data[0])
}


const is_repeated = (user_id, intent_name) => {
  add(user_id, intent_name)
  return n_the_same(user_id)
}


module.exports = {
  is_repeated
}