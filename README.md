# Todo

* squidex
  * Make linked topics work
    * still work with QRs (?)
    * test for button label
    * what do about [more]?
    * when updating via webhook, redo links (breaks buttons at the moment)
    * proper error on squidex not found
    * Shouldn't die on one bad topic
  * space out replies
  * image tag for Messenger
  * handle server down
  * make it optional
  * copy 'Facebook Messenger' Dialogflow content for import
* Pre-populate hello guest
* Airtable
* fix floaty short messages
* webchat: emoji
* test sentry
* Test case assessment
* Incorporate case assessment webhook
* decorate Lagbot version
* Answers
  * schema-tise
    * with alt questions
  * speed up answer showing
  * by category
  * nice quotes
  * should just send names & links
  * make add to bottom work nicely when the page is only gradually filling up with short answers
* web client
  * event on sidebar open
  * disable send button, not text entry
* try a bunch of fail states (each env var being a bit wrong)
* cache
* record interview against user
* check loading experience (clearing/disabled input box?)
* allow optional adapters
* Log too-long intents
* timestamp to log
* Update readme
  * incorporate messenger server docs
* Get rid of remaining coffeescript
* follow-up notifications?
* We could have abbreviations (https://bitsofco.de/making-abbr-work-for-touchscreen-keyboard-mouse/)


## Some(!) of the below is out of date

----

# Chat server

A Botkit-based chatbot server for websocket & Messenger clients. This is intended to supersede `messenger-server`, `webchat-server` and `webchat-client`. It uses [Dialogflow](https://dialogflow.cloud.google.com/) to identify intents,
and [Squidex](https://squidex.io/) to host the content.


## Squidex schema

The server will be looking for a topic schema including:

* **intentKey** to match Dialogflow intents
* **answer**: the topic content, which can make use of the below syntax
* **source**: optional citation, e.g. 'Employment Relations Act 2000'


## Message syntax

This server interprets messages with custom syntax. Like:

* images: `[Image: https://i.imgur.com/lYm759q.jpg]`
* buttons:
  * `[Emergency phone 111]`
  * `[Community Law https://communitylaw.org.nz]`
* cards: `[Cards: Card 1 title (Card 1 subtitle): Button label: Text to send to Dialogflow on click; Card 2 title...]`

These old-fashioned syntaxes are still supported, though using Squidex to create topic links & record sources is preferrred:

* sources: `[Source: Employment Relations Act 2000, ss 69B, 69N, 69O]`
* FU: `[FU: Words to show the user: Words to send to Dialogflow]`
* QR: `[QR: Message text; Option 1 words to show user: Text to send to Dialogflow; Option 2 words to show user: Words to send to Dialogflow; etc]`

It also spaces out bot messages, so recipients have time to read them.

## Running locally

You will need

* a [Dialogflow](https://dialogflow.com) agent, with a certain schema setup.
* a [Squidex](https://squidex.io/) app.
* Ngrok…
* If you'd like the instance to update live from Squidex… rules… webhook

Run `npm install`, then `npm start`. The script will tell you what environment variables are required. You can put them in a `.env` file.

### Optional environment variables

* **dialogflow_environment**: If your agent has multiple environments (e.g. live and staging), set the environment name here

* **sentry_dsn**: Keep track of errors with [Sentry](https://sentry.io/)

* **delay_ms**: Overide the default (25) number of milliseconds per character to space out bot messages by.

* **NODE_ENV**: Set to 'development' to get more detailed logs


## Errors

* 'Experienced an error inside the turn handler Error: Invalid signature on incoming request' — indicates a wrong value for the fb_app_secret environment variable

## Hosting notes

* Assuming Ubuntu / Digital Ocean
* `nvm install 13.12.0`
* [Create a safeuser and install pm2](https://www.digitalocean.com/community/tutorials/how-to-use-pm2-to-setup-a-node-js-production-environment-on-an-ubuntu-vps)
* [Install nvm](https://github.com/nvm-sh/nvm#install--update-script)
* `git clone https://github.com/Citizen-AI/chat-server`
* Populate `.env` as per the above
* `npm install`
* `pm2 start npm -- start; pm2 start 0`
* Install nginx
* [Configure nginx to handle websockets](https://www.nginx.com/blog/websocket-nginx/)
* Will need an nginx config file that proxies domain.com to 127.0.0.1:3000
* [Set up https](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-18-04)



## Thanks to

* [Nick Volynkin](https://stackoverflow.com/a/30772025/1876628) for `git diff` between to local repositories
* [Andrew Downes
](https://stackoverflow.com/questions/23047211/replace-all-instances-of-a-string-within-an-object-and-or-array-javascript) for find and replace across a whole object
* [Mohammad Usman](https://stackoverflow.com/a/53718921/1876628) for a nice way of filtering out properties from an array of objects