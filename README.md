# Todo

* make web client work
* record interview against user
* Answers
* Kontent.ai
* initial chat delay to .env
* Fix FB user name swapping in
* can we combine
  * some templates?
  * df_to_X_formatter
* allow optional adapters
* Log too-long intents
* timestamp to log
* Update readme
* … 


# The below need updating & pertains to an older websocket-only version

----

# Chat server

A Botkit-based chatbot server for websocket & Messenger clients.

## Notes on syntax

This server interprets Dialogflow messages with custom syntax. Like:

* sources: `[Source: Employment Relations Act 2000, ss 69B, 69N, 69O]`
* cards: `[Cards: Card 1 title (Card 1 subtitle): Button label: Text to send to Dialogflow on click; Card 2 title...]`
* buttons:
  * `[Emergency phone 111]`
  * `[Community Law https://communitylaw.org.nz]`
* FU: `[FU: Words to show the user: Words to send to Dialogflow]`
* QR: `[QR: Message text; Option 1 words to show user: Text to send to Dialogflow; Option 2 words to show user: Words to send to Dialogflow; etc]`

It also spaces out bot messages, so recipients have time to read them.

## Running locally

You will need

* a [Dialogflow](https://dialogflow.com) agent.

* a chat client (e.g. [this one](https://github.com/Citizen-AI/workbot-webchat-client))

Run `npm install`, then `npm start`. The script will tell you waht environment variables are required. You can put them in a `.env` file. 

### Optional environment variables

* **dialogflow_environment**: If your agent has multiple environments (e.g. live and staging), set the environment name here

* **sentry_dsn**: Keep track of errors with [Sentry](https://sentry.io/)

* **delay_ms**: Overide the default (25) number of milliseconds per character to space out bot messages by.

* **NODE_ENV**: Set to 'development' to get more detailed logs


## Thanks to

* [Nick Volynkin](https://stackoverflow.com/a/30772025/1876628) for `git diff` between to local repositories
* [Andrew Downes
](https://stackoverflow.com/questions/23047211/replace-all-instances-of-a-string-within-an-object-and-or-array-javascript) for find and replace across a whole object