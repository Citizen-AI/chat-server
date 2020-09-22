'use strict'
// Modified from https://github.com/googleapis/nodejs-dialogflow
// and https://github.com/googleapis/nodejs-dialogflow/blob/master/samples/resource.js
// Auth from https://medium.com/@tzahi/how-to-setup-dialogflow-v2-authentication-programmatically-with-node-js-b37fa4815d89

const dialogflow = require('@google-cloud/dialogflow')

const bus = require('../event_bus')
const { regex } = require('../helpers')

const { google_creds, dialogflow_environment } = process.env
const credentials = JSON.parse(google_creds)
const { project_id } = credentials
const config = { credentials }

bus.emit(`STARTUP: Using Dialogflow project: ${project_id}`)
if(dialogflow_environment) bus.emit(`STARTUP: Using Dialogflow environment: ${dialogflow_environment}`)

const intentsClient = new dialogflow.IntentsClient(config)
const agentPath = intentsClient.agentPath(project_id)


const df_query = async ({ query, session_id }) => {
  const sessionClient = new dialogflow.SessionsClient(config)
  const session = dialogflow_environment ?
    sessionClient.environmentSessionPath(project_id, dialogflow_environment, '-', session_id.toString())
    : sessionClient.projectAgentSessionPath(project_id, session_id.toString())
  const [ response ] = await sessionClient.detectIntent({
    session,
    queryInput: { text: { text: query, languageCode: 'en-US' } }
  })
  return response.queryResult
}


// https://cloud.google.com/dialogflow/es/docs/how/manage-intents#create_intent
const create_intent = ({ displayName }) => new Promise(async (resolve, reject) => {
  const intent_request = {
    parent: agentPath,
    intent: { displayName }
  }
  const [ response ] = await intentsClient.createIntent(intent_request)
    .catch(reject)
  const intent_key = response.name.match(regex.dialogflow_intent_key_from_name)?.[1]
  resolve(intent_key)
})


module.exports = {
  df_query,
  create_intent
}
