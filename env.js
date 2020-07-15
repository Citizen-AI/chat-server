require('dotenv').config()
envalid = require('envalid')


const { str, url, json } = envalid
envalid.cleanEnv(process.env, {
  google_creds: json({ desc: 'The contents of a Google Cloud json keyfile for the service account of a Dialogflow agent, with line breaks removed. To get this keyfile, go to the settings page of your Dialogflow agent; click the service account, find the service account with the name Dialogflow Integrations, create a key; download the JSON.' }),
  mongo_conn_string: url({ desc: 'Mongo DB cloud (or similar) connection string, including username and password' }),
  squidex_endpoint: str({ desc: 'Squidex API url endpoint for chatbot topics'}),
  squidex_client_id: str({ desc: 'Squidex auth token (get from your Squidex app > Settings > Clients > [Client] > Client Id'}),
  squidex_client_secret: str({ desc: 'Squidex auth token (get from your Squidex app > Settings > Clients > [Client] > Client Secret' })
})
