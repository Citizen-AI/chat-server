'use strict'
// Event bus plus sends errors to Sentry, both explicitly with captureException, and any other fatal errors

const EventEmitter = require('eventemitter2').EventEmitter2
const chalk = require('chalk')
const Sentry = require('@sentry/node')


const { sentry_dsn, NODE_ENV } = process.env
Sentry.init({ dsn: sentry_dsn, environment: NODE_ENV })
const bus = new EventEmitter({ wildcard: true })


bus.onAny((event, payload) => {
  let error_message = ''
  if(event.match(/^error/i)) {
    error_message = `${event}`
    if(payload) error_message += `| ${payload}`
    console.log(chalk.red(error_message))
    Sentry.captureException(new Error(error_message))
  }
  else {
    let log_message = chalk.green(`${event}`)
    const intent_name = payload?.df_result?.intent?.displayName
    if(intent_name) log_message += ': ' + chalk.yellow(intent_name)
    console.log(log_message)
    if(payload && (NODE_ENV === 'development')) {
      console.log('Payload:', Object.keys(payload))
    }
  }
})


if(sentry_dsn) bus.emit(`STARTUP: Sending errors to ${sentry_dsn}`)


module.exports = bus
