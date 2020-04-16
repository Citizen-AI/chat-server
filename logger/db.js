'use strict'

const mongoose = require('mongoose')

const bus = require('../event_bus')
const { emit_error } = require('../helpers')


const { mongo_conn_string } = process.env
mongoose
  .connect(mongo_conn_string, { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true })
  .then(m => bus.emit(`STARTUP: connected to database ${m.connections[0].host}/${m.connections[0].name}`))
  .catch(emit_error)
const Schema = mongoose.Schema
const ObjectId = mongoose.Schema.Types.ObjectId

const UserSchema = new Schema({
  id: String,
  feedback: [{
    feedback: String,
    created_at: { type: Date, default: Date.now }
  }],
  starts: [{
    platform: String,
    created_at: { type: Date, default: Date.now }
  }],
  last_platform: String,
  created_at: { type: Date, default: Date.now }
})

const EventSchema = new Schema({
  created_at: { type: Date, default: Date.now },
  event_type: { type: String, required: true },
  user: { type: String, ref: 'User' },
  user_said: String,
  user_quick_reply: String,
  bot_said: Object,
  df_session: String,
  df_messages: Array,
  df_intent: String,
  df_confidence: Number,
  host: String
})

const User = mongoose.models.User || mongoose.model('User', UserSchema)
const Event = mongoose.models.Event || mongoose.model('Event', EventSchema)


const update_user = (user_id, update) => new Promise((resolve, reject) =>
  User.findOneAndUpdate(
    { id: user_id },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true },
    (err, doc) => {
      if(err) {
        emit_error(err)
        reject(err)
      }
      else resolve(doc)
    }
  )
)


module.exports = {
  update_user,
  User,
  Event
}