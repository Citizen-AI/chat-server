'use strict'

require('../../env')
const FB = require('fb')


const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const { fb_page_token, fb_persistent_menu } = process.env

FB.setAccessToken(fb_page_token)

FB.api('/me', 'get', { fields: [ 'id', 'name' ] })
  .then(async res => {
    console.log(`Connected to Messenger profile '${res.name}': https://m.me/${res.id}`)
    console.log(`You have five seconds to interrupt before this script attempts to delete and re-set get started postback & persistent menu…`)
    await sleep(5000)
    FB.api('/me/messenger_profile', 'delete',
           { fields: [ 'persistent_menu', 'get_started' ] },
           console.log)
    FB.api('/me/messenger_profile', 'post',
           {
             persistent_menu: [ fb_persistent_menu ],
             get_started: { payload: 'GET_STARTED' } 
           },
           console.log)
  }
)