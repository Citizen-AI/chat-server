# Modified from https://github.com/googleapis/nodejs-dialogflow
# and https://github.com/googleapis/nodejs-dialogflow/blob/master/samples/resource.js
# Auth from https://medium.com/@tzahi/how-to-setup-dialogflow-v2-authentication-programmatically-with-node-js-b37fa4815d89

dialogflow = require('dialogflow').v2beta1

{ regex } = require '../helpers'
bus = require '../event_bus'


{
  google_creds
  dialogflow_environment
} = process.env
credentials = JSON.parse google_creds
project_id = credentials.project_id

config = credentials: credentials
bus.emit "STARTUP: using Dialogflow project: #{project_id}"
if dialogflow_environment
  bus.emit "STARTUP: using Dialogflow environment: #{dialogflow_environment}"

user_type_to_contexts =
  'landlord': ['landlord']
  'private': ['private']
  'boardinghouse': ['boardinghouse', 'boardinghouse-or-social-housing']
  'social-housing': ['socialhousing', 'boardinghouse-or-social-housing']
  null: []
  '': []


module.exports =
  df_query: ({ query, session_id }) ->
    sessionClient = new dialogflow.SessionsClient config
    session = if dialogflow_environment
        sessionClient.environmentSessionPath project_id, dialogflow_environment, '-', session_id.toString()
      else
        sessionClient.sessionPath project_id, session_id.toString()
    responses = await sessionClient.detectIntent
      session: session
      queryInput:
        text:
          text: query
          languageCode: 'en-US'
    responses[0].queryResult



  send_context: ({session_id, user_type, fb_first_name, on_success, on_failure}) ->
    session_id = session_id.toString()
    contextsClient = new dialogflow.ContextsClient config
    session_path = contextsClient.sessionPath project_id, session_id
    responses = []
    responses.push await contextsClient.createContext
      parent: session_path
      context:
        name: contextsClient.contextPath project_id, session_id, 'generic'
        parameters: fb_first_name: fb_first_name
        lifespanCount: 999

    for context_name in user_type_to_contexts[user_type]
      responses.push await contextsClient.createContext
        parent: session_path
        context:
          name: contextsClient.contextPath project_id, session_id, context_name
          lifespanCount: 999
    if responses.length is user_type_to_contexts[user_type].length + 1
      on_success()
    else
      on_failure()
    responses
