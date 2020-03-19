require('dotenv').config()
envalid = require('envalid')


const { str, url, json } = envalid
envalid.cleanEnv(process.env, {
    google_creds: json({ desc: 'The contents of a Google Cloud json keyfile for the service account of a Dialogflow agent, with line breaks removed. To get this keyfile, go to the settings page of your Dialogflow agent; click the service account, find the service account with the name Dialogflow Integrations, create a key; download the JSON.' }),
    mongo_conn_string: url({ desc: 'Mongo DB cloud (or similar) connection string, including username and password' }),
    fb_page_token: str({ desc: 'Facebook Page Access Token' }),
    fb_verify_token: str({ desc: 'Facebook Verify Token' }),
    fb_app_secret: str({ desc: 'Facebook App Secret' }),
})

