# Todo

* squidex
  * Make linked topics work
    * test for button label
    * what do about [more]?
    * Shouldn't die on one bad topic
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
* decorate 404
* Answers
  * schema-tise
    * by category
    * with alt questions
  * log answer views
  * fix scroll
  * make QRs work
  * nice quotes
  * should just send names & links
  * make add to bottom work nicely when the page is only gradually filling up with short answers
  * error on no question found (so we can add them)
* web client
  * event on sidebar open
  * disable send button, not text entry
* try a bunch of fail states (each env var being a bit wrong)
* cache
* record interview against user
* check loading experience (clearing/disabled input box?)
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

* a [Dialogflow](https://dialogflow.com) agent.
* a [Squidex](https://squidex.io/) app, with a certain schema setup.
* Ngrok…
* If you'd like the instance to update live from Squidex:
  * Go to `https://cloud.squidex.io/app/<your app>/rules`
  * New > Content Changed > Add Schema (topic) > Next > Webhook
  * In the Send webhook screen, Url field, use `<your server>/api/squidex`

Run `npm install`, then `npm start`. The script will tell you what environment variables are required. You can put them in a `.env` file.


### Optional environment variables

* **Messenger adapter**: to connect your bot to Facebook Messenger, you'll need to add these environment variables:
  * **fb_page_token**: Facebook Page Access Token (get from https://developers.facebook.com/ > your app > Messenger > Settings > Access Tokens > Generate Token
  * **fb_verify_token**: Facebook Verify Token  (get from https://developers.facebook.com/ > your app > Messenger > Settings > Webhooks > Edit Callback URL)
  * **fb_app_secret**: Facebook App Secret (get from https://developers.facebook.com/ > your app > Settings > Basic > App Secret

* **dialogflow_environment**: If your agent has multiple environments (e.g. live and staging), set the environment name here

* **sentry_dsn**: Keep track of errors with [Sentry](https://sentry.io/)

* **delay_ms**: Overide the default (25) number of milliseconds per character to space out bot messages by.

* **NODE_ENV**: Set to 'development' to get more detailed logs


## Errors

* 'Experienced an error inside the turn handler Error: Invalid signature on incoming request' — indicates a wrong value for the fb_app_secret environment variable

## Hosting notes

* Assuming Ubuntu / Digital Ocean
* [Create a safeuser and install pm2](https://www.digitalocean.com/community/tutorials/how-to-use-pm2-to-setup-a-node-js-production-environment-on-an-ubuntu-vps)
* [Allow ssh with safeuser@](https://www.digitalocean.com/community/questions/error-permission-denied-publickey-when-i-try-to-ssh?answer=44730)
* [Install nvm](https://github.com/nvm-sh/nvm#install--update-script)
* `nvm install-latest-npm`
* Install a nice recent version of Node like: `nvm install 13.12.0` (I use the new Coffeescripty
  [optional chaining operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining))
* `git clone https://github.com/Citizen-AI/chat-server`
* Populate `.env` as per the above
* `npm install`
* `pm2 start npm -- start; pm2 start 0`
* Install nginx
* [Configure nginx to handle websockets](https://www.nginx.com/blog/websocket-nginx/)
* Will need an nginx config file that proxies domain.com to 127.0.0.1:3000
* [Set up https](https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-18-04)
* Set up Squidex rule (see above) to notify app of content changes



## Thanks to

* [Eze Rodriguez
](https://www.facebook.com/groups/NewZealandtechstartups/?post_id=2826203547491477&comment_id=2826237847488047) for the suggestion of using express routes rather than nginx aliases
* [Nick Volynkin](https://stackoverflow.com/a/30772025/1876628) for `git diff` between to local repositories
* [Andrew Downes
](https://stackoverflow.com/questions/23047211/replace-all-instances-of-a-string-within-an-object-and-or-array-javascript) for find and replace across a whole object
* [Mohammad Usman](https://stackoverflow.com/a/53718921/1876628) for a nice way of filtering out properties from an array of objects