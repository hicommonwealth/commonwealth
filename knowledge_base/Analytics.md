# Analytics

Our analytics tracking scripts live in `packages/commonwealth/shared/analytics`. Currently, we have only Mixpanel configured to collect usage analytics, but the scripts can be extended by simply a new payload interface like `BaseMixpanelPayload` and updating the tracking scripts to work with the other providers.

In the client, a hook called `useBrowserAnalyticsTrack` has been created to simplify the process of recording interactions. If can be used in 2 distinct ways:

1. To record page visits/component mounts, by simply adding `useBrowserAnalyticsTrack({...})` to a page. This will record any time the component mounts. You do not need to ensure that it only runs once- the hook handles this logic.

2. To record when specific actions occur. The hook returns a function like `{ trackAnalytics } = useBrowserAnalyticsTrack({ onAction: true })`, which can then simply be invoked like `trackAnalytics({...})` whenever you want a user action to correspond to an analytics record.

In the server, a function `serverAnalyticsTrack({...})` has been created and can be placed inside any server-side function to record events.

The client side code is generally more useful; most server tracking events are technically redundant and can be captured via SQL query. But being in the habit of adding analytics tracking to any part of the codebase you touch will pay dividends down the road.

## Change Log

- 230531: Authored by Alex Young.
