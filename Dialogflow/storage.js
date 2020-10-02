'use strict'
// in-memory storage to keep track of the number of times in a row people get the default fallback intent

const user_repeated_fallbacks = {}


const inc_fallback = user_id => {
  user_repeated_fallbacks[user_id] = (user_repeated_fallbacks[user_id] || 0) + 1
  return user_repeated_fallbacks[user_id]
}


const reset_fallback = user_id => {
  user_repeated_fallbacks[user_id] = 0
  return 0
}


module.exports = {
  inc_fallback,
  reset_fallback
}