# Twitter

## Link Previews

Link previews are used as little cards when posting a link on Twitter.

Link Previews are implemented using the Open Graph Standard: [https://ogp.me/](https://ogp.me/). Our implementation lives at `setupAppRoutes.ts` and queries the DB against the provided slugs to generate opengraph metadata.

To get link previews, you will need to do the following:

1. In `database.ts` comment out the line `ssl: { rejectUnauthorized: false },`
2. Build the site: `yarn build`
3. Run against the built site in the packages/commonwealth folder with:

    ```bash
    NO_PRERENDER=true NO_CLIENT_SERVER=true MIXPANEL_DEV_TOKEN=foo MIXPANEL_PROD_TOKEN=bar NODE_ENV=production npx tsx  server.ts
    ```

4. With the site running, query the link preview with `curl -G http://localhost:8080/<url>`
5. Ensure it works on production using [https://cards-dev.twitter.com/validator](https://cards-dev.twitter.com/validator)

## Change Log

- 240415: Generalized and renamed by Graham Johnson (from `Link-Previews.md` to `Twitter.md`).
- 230426: Authored by Jake Naviasky.
