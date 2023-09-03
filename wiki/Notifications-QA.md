_Authored by Timothee Legros, 230803._

# Prerequisites
## Subscriptions
- Be logged in on a new account with MetaMask that has no pre-existing joined communities.
- Should have the `Networks` tab of Chrome Dev Tools open.
## Notifications
- Be logged in on 2 new accounts both with MetaMask. This is most easily done by using Chrome and Firefox with different MetaMask accounts but you can also simply logout and log back in with a different account on the same browser.
- The account used to receive and view notifications will be called the `viewer` and the account used to produce notifications will be called the `producer`.

# Forum
## Subscriptions
### New Threads
1. Navigate to any community's discussion page that you have not yet subscribed to e.g. [https://commonwealth.im/ethereum/discussions][1]
    - Ensure that the Notifications button in the sidebar (shown in the image below) shows `Notifications Off`
3. Click on the button to turn on Notifications.
    - The button should be filled with the color blue and display `Notifications On` like in the image below
    - The networks tab should show a single new request to `/createSubscription` which returned the new subscription
4. Navigate to your notification settings page i.e. [https://commonwealth.im/notification-settings][2]
    - A new row for the community you subscribed to should be present.
    - When clicking the drop-down a single sub-row should appear showing the new threads subscription.
5. Navigate back to the discussion page by hitting the back button.
    - The notifications button should still display `Notifications On`.
6. Click the notifications button again to delete the subscription.
    - The networks tab should show a single successful route call to `/deleteSubscription`
7. Navigate to your notification settings again.
    - The row for the community you interacted with should no longer be listed under `Discussion`

### New Comments and New Reactions
**Another User's Thread**
1. Navigate to another user's thread e.g. [https://commonwealth.im/ethereum/discussion/12197-httpscommonwealthimethereumnewdiscussion][3]
2. Click on the subscribe bell icon directly underneath the thread body.
    - The icon should switch to a bell with a line through it and it should say `unsubscribe`
    - The network tab should display 2 new successful route calls both to `/createSubscription`. One should have `new-reaction` category and the other `new-comment-creation`
3. Refresh the page to bypass known [issue #4647][4]
4. Navigate to the notifications settings page
    - A new row for the community you subscribed to should be present.
    - When clicking the drop-down for that community, 2 rows should appear. One row should be for new comments and one for new reactions on the thread. Ensure that the thread title matches the thread you subscribed to.
5. Click the back button to return to the thread page.
6. Click the `unsubscribe` button.
    - The button should switch back to `subscribe`
    - The networks tab should show a single successful route call to `/disableSubscriptions`
7. Navigate once again to the notifications settings page
    - The 2 subscription rows should still exist but the toggle for the community subscription row should be disabled.
8. Navigate back to the thread page.
9. Click the subscribe button again.
    - The button should switch back to `unsubscribe`
    - The networks tab should show a single successful route call to `/enableSubscriptions`
10. Navigate to the notifications settings page
11. Click the 3 dots next to the reactions subscription on the relevant thread/community and then click `unsubscribe`.
    - The reactions subscription on the relevant thread should disappear.
    - The networks tab should show a single successful request to `/deleteSubscription`
12. Navigate back to the thread page.
    - The subscription button should show `subscribe` not `unsubscribe`
13. Click the `subscribe` button
    - The button should switch to `unsubscribe`
    - The networks tab should show 2 new requests. One of the requests should be to `/createSubscription` and the body should contain `category: new-reaction`. The other request should be to `/enableSubscriptions` and the body should contain a single subscription id.

**Your Thread**
1. Navigate to any EVM community you have never interacted with.
2. Create a thread on the General topic.
3. Refresh the page to bypass known [issue #4647][4]
    - The `subscribe` button under the thread body should now display `unsubscribe`
4. Navigate the settings page.
    - A new row should exist under `Discussion` that is associated with the community in which you created the thread.
    - When clicking the drop-down for that community, 2 rows should appear. One row should be for new comments and one for new reactions on the thread you just created.
5. Run through steps 5-13 of QAing another user's thread subscriptions above.

**Your Comment**
1. Navigate to any EVM community you have never interacted with.
2. Create a comment on a thread that is not yours
3. Nativate to your notifications settings page.
    - A new row should exist under `Discussion` that is associated with the community in which you created the comment.
    - When clicking the drop-down for that community, 2 rows should appear. One row should be for new comments and one for new reactions on the comment you just created.
4. Click on the 3 dots next to the reaction subscription for the comment you created and click `unsubscribe`.
    - The row should disappear.
    - The network tab should show a single new successful request to `/deleteSubscription`
5. Repeat for the sub-comment subscription.
6. Navigate back to the comment you created. Due to [known issue #4659][8] you cannot resubscribe now that the subscriptions are deleted.

### New Mention

Due to [known bug #4657][9] you cannot manage your mention subscription from the notification settings page.

### New Collaboration

Due to [known bug #4657][9] you cannot manage your collaboration subscription from the notification settings page.

## Notifications
### New Threads
1. With your viewer account navigate to any MetaMask-compatible community (preferably an unpopular one since notifications will be emitted faster e.g. alex-test-2). If you have not yet joined this community, join it now.
2. Subscribe to new thread notifications using the viewer account by clicking the large `Notifications Off/On` button in the sidebar.
3. With your producer account navigate to the same community (join it if you haven't already) and create a thread in the 'General' topic.
4. On your viewer account, refresh the page.
    - Refresh until you see the notification appear in your notification drop-down. This may take up to 5 minutes depending on the community you chose.
5. Once the notification appears, click on it
    - You should be taken to the thread page of the thread you just created from the producer.

### New Comments
This section picks up exactly where the previous New Threads section left off (from the viewer account on the threads page).
1. With your viewer account subscribe to comments and reactions on the thread using the `subscribe` button below the thread body.
2. From your producer account, create a comment on the thread you created.
3. With your viewer account navigate away from the thread (to anywhere e.g. community landing page).
4. On your viewer account refresh the page (again, may need to refresh multiple times after waiting for some time).
    - You should see the new comment notification appear in your notification drop-down.
5. Using your viewer account click on the notification.
    - You should be taken to the comment on the thread you created with your producer account.

### New Reactions
This section picks up exactly where the previous New Comments section left off (from the comment on the threads page).
1. On your viewer account navigate back to the community discussion page.
2. On your producer account upvote your own thread.
3. On your viewer account, refresh the page (again, may need to refresh multiple times after waiting for some time).
    - You should see the new reaction notification appear in the notification drop-down
4. Using your viewer account click on the notification.
    - You should be taken to the thread you created with your producer account.

### New Mention
**Currently not working due to [known bug #4690][11]**

This section picks up exactly where the previous New Reactions section left off (from the threads page).
1. With your viewer account, unsubscribe from the thread.
2. With your viewer account, navigate back to the community discussion page.
3. With your producer account, create a new comment and this time tag your viewer account.
4. With your viewer account, refresh the page.
    - You should see the new mention notification appear in the notification drop-down
5. Using your viewer account click on the notification.
    - You should be taken to the comment you are tagged in.

### New Collaboration
This section picks up exactly where the previous New Mention section left off (from the threads page).
1. With your viewer account, navigate back to the community discussion page.
2. With your producer account, add the viewer account as a collaborator on the thread you created.
3. With your viewer account, refresh the page.
    - You should see the new collaboration notification appear in the notification drop-down
4. Using your viewer account click on the notification.
    - You should be taken to the thread that you are now a collaborator of.

# Snapshot
## Subscriptions
1. Navigate to the snapshot page of a community that has an associated snapshot space like dYdX i.e. [https://commonwealth.im/dydx/snapshot/dydxgov.eth][6]
2. Click on the `Subscribe to Notifications` button.
    - The network tab should show a single new successful request to `/createSubscription` where the payload contains the `snapshot_id`.
    - The button should switch to `Remove Subscription`
3. Navigate to your notification settings page. According to [known bug #4658][7] the subscriptions don't show up on this page.
4. Navigate back to the snapshot page and click on `unsubscribe`
    - The button should switch back to `Subscribe to Notifications`.
    - The network tab should show a single new successful request to `/deleteSubscriptions`

## Notifications
Cannot QA Snapshot notifications until [#4667][10] is completed.

# Chain Event
## Subscriptions
1. Navigate to your [notifications settings page][2].
    - Assuming you haven't joined any communities, the `Chain Events` section will be empty.
2. Join one of these communities (pick one you haven't joined before): osmosis, dydx, tribe, aave, moola-market, impactmarket, autonomies-testnet-dao.
3. Navigate back to your [notifications settings page][2].
    - The community you just joined should appear under the `Chain Events` section.
    - The subscription toggle for that community should be set to "off".
4. Click the toggle to enable chain-event subscription for the community you just joined. Note that if the subscription reorders itself it is [known bug #4650][5]
    - The network tab should show a single new succesful request to `/createSubscription`
    - The console tab should show a single log: `Adding Websocket subscriptions for: ['tribe']`
5. Click the toggle again.
    - The network tab should show a single new succesful request to `/disableSubscription`
    - The console tab should show a single log: `Deleting Websocket subscriptions for: ['tribe']`
5. Click the toggle again.
    - The network tab should show a single new succesful request to `/enableSubscription`
    - The console tab should show a single log: `Adding Websocket subscriptions for: ['tribe']`

## Notifications
Cannot QA chain-event notifications until [#4667][10] is completed.


[1]: https://commonwealth.im/ethereum/discussions
[2]: https://commonwealth.im/notification-settings
[3]: https://commonwealth.im/ethereum/discussion/12197-httpscommonwealthimethereumnewdiscussion
[4]: https://github.com/hicommonwealth/commonwealth/issues/4647
[5]: https://github.com/hicommonwealth/commonwealth/issues/4650
[6]: https://commonwealth.im/dydx/snapshot/dydxgov.eth
[7]: https://github.com/hicommonwealth/commonwealth/issues/4658
[8]: https://github.com/hicommonwealth/commonwealth/issues/4659
[9]: https://github.com/hicommonwealth/commonwealth/issues/4657
[10]: https://github.com/hicommonwealth/commonwealth/issues/4667
[11]: https://github.com/hicommonwealth/commonwealth/issues/4690
