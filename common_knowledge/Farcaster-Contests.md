# Farcaster Local Development

Tags: #cw

## Create a Farcaster account

First, sign up for a Farcaster account. Warpcast is a Farcaster client that allows you to create an account. It works on mobile and browser.

- Sign up at https://warpcast.com/

## Setup ngrok

ngrok is a reverse proxy that allows you to create a publicly accessible URL that sends traffic to your local machine, in order to test webhooks locally.

- Log into https://dashboard.ngrok.com (create free personal account)
- Go to `Domains` -> `New Domain` to generate a free static domain
- Use this command to run ngrok:
	- `ngrok http --url=YOUR_NGROK_DOMAIN 8080`
	- ⭐️ Save as shell alias or local bash script since you’ll need to run this later and often

## Setup Neynar webhook

Neynar is a 3rd party API used for creating Farcaster webhooks and fetching data from the Farcaster network.

- Log into https://dev.neynar.com (should be added to Dillon’s team)
- Create new webhook for the CastCreated event (each dev must have their own webhook)
	- Name: `Cast Created (YOUR_NAME)`
	- TargetURL: `https://YOUR_NGROK_DOMAIN/api/integration/farcaster/CastCreated`
	- Set filter: `cast.created` -> `embeds` -> `contests`

## Set local env vars

Add these env vars to your .env file. Fill in the API key (ask a dev) and your own ngrok domain:

```
FLAG_FARCASTER_CONTEST=true
NEYNAR_API_KEY=<Get from Neynar dashboard>
NEYNAR_CAST_CREATED_WEBHOOK_SECRET=<Get from Neynar dashboard>
NEYNAR_REPLY_WEBHOOK_URL=https://YOUR_NGROK_DOMAIN/api/integration/farcaster/ReplyCastCreated
FARCASTER_ACTION_URL=https://YOUR_NGROK_DOMAIN/api/integration/farcaster/CastUpvoteAction
FARCASTER_NGROK_DOMAIN=https://YOUR_NGROK_DOMAIN
```

Note: `FARCASTER_NGROK_DOMAIN` should only be used locally– not on QA or production.

## Run local services

Run services required for testing contests:

- Chain listener: `pnpm start-evm-ce`
- Message relayer: `pnpm start-message-relayer`
- Consumer: `pnpm start-consumer`
- App: `pnpm start`

Also ensure that ngrok is running. Don't copy-paste the command from the ngrok website– use the aforementioned script.

## Add the Upvote cast action

Farcaster allows users to add a custom “action” to their account, which can be used on any cast. An action can be added to your account through a special URL.
- Add your FARCASTER_ACTION_URL (from .env) to the end of this warpcast URL: `https://warpcast.com/~/add-cast-action?actionType=post&name=Upvote+Content&icon=thumbsup&postUrl=FARCASTER_ACTION_URL`
- Paste URL into browser, you’ll see the Warpcast page, then click `Add Action`

## How to test the Farcaster/Contests integration
- Create a Farcaster Contest with a funding token (e.g. CMN on Base Sepolia `0x429ae85883f82203D736e8fc203A455990745ca1`)
- Copy the Farcaster Contest URL. It should have this format: `https://YOUR_DOMAIN/api/integration/farcaster/contests/CONTEST_ADDRESS/contestCard`
- Post a the URL to WarpCast
  - it should trigger the `CastCreated` webhook and associate the Cast (message) with the contest. It’ll also create a new programatic webhook for `CastReplyCreated`.
- Then, add a reply message to the contest cast.
	- This should trigger the `CastReplyCreated` webhook, which will create onchain content.
- Finally, perform the custom Upvote action on your reply message (icon with 4 squares).
	- This should trigger the `CastUpvoteAction` webhook, which ultimately creates an onchain vote.
