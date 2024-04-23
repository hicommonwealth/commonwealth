# Thread Loading Flow

## Purpose

This doc describes the current state of thread flow + process logic, in as much detail as possible.

Providing a solution to improve existing thread workflows is a non-goal of this document.

## Threads Init

1. In `state.ts`, the `/status` endpoint responds with recent threads (`recentThreads`) that are stored in `recent_activity.ts` and then used in different parts of the app to sort the communities/chains based on threads count.
2. In `IChainAdapter.ts`, the `/bulkOffChain` api responds with `numTotalThreads` (used on the `/:community/discussions` page to show the total threads count) and `numVotingThreads` (used on the `/:community/discussions` page on the stages menu filter).
3. `IChainAdapter.ts` calls a method in `recent_activity.ts` and the `/activeThreads` api responds with threads that get stored in the `threads.ts` store in the `overviewStore` sub store key and get used in the `/:community/overview` page to show monthly threads count.
4. `IChainAdapter.ts` hits the `/threadsUsersCountAndAvatars` endpoint which, if provided threads as payload, will respond with unique users for list of threads(thread_id), first 2 avatars for each group of users and lastly some latest comments.

- However, when called from IChainAdapter, the endpoint responds with an empty array since it uses the `listingStore` sub store from `threads.ts` to get pinned threads as payload but at this time the listing store mostly has no pinned threads.

5. `DiscussionsPage.tsx` calls the `bulkThreads` method in `threads.ts`. The `bulkThreads` api responds with 20 threads paginated based on the params provided in payload.

- These threads are then added to the `store` and `listingStore` substores in the `threads.ts` store which are then used on the `/:community/overview` and on the `/:community/discussions` (only on the `/:community/discussions` page the `store` substore in threads is used as cached data).
- Threads on the `/overview` and `/discussions` pages are loaded by this same api. New responses are concatenated with existing ones + duplicates are removed.

6. The `/reactionsCounts` api responds with user interaction data from the provided thread ids as payload. This data is then propagated to the `reactionCounts.ts` store and used in different parts of the app for reaction counts.
7. `threads.ts` calls a method in `threadsUsersCountAndAvatars.ts`. The `/threadsUsersCountAndAvatars` api is triggered again but this time it is given given threads from the `/bulkThreads` api response as payload. The new response is handled in the same way. At this time we dont query for pinned threads (we don’t send the boolean pinned key as payload)

### Thread init on the “viewing a thread” page

- The `/getThreads` api will get a thread details from the api. This is then added/merged/updated in `store` substore in `threads.ts`, if this thread was not fetched before then the `app.threads.numTotalThreads` is incremented by 1.
- The `/reactionCounts` api is triggered and response is added to the `reactionCounts.ts` store and used in different parts of the app for reaction counts.
- The `/viewComments` api is triggered and the response is added to the `store` in `comments.ts` store
- The `/getPolls` api is triggered and the response is added to the `store` in `polls.ts` store. The store update is handled in a merger way (if the data is already there then its replaced by the new data)
- The `/viewCount` api is triggered, the response from the api is not stored anywhere in any store.

### Threads processes

On Scroll in `DiscussionsPage.tsx`

- The `/bulkThreads` api is triggered when the user scrolls down, 20 more threads are loaded from api until api has no more threads for the provided payload.

On creating a thread

- The `/createThread` api will trigger and the response will be added to the `store` and `listingStore` substore in the `threads.ts` store. The `app.threads.numTotalThreads` is also incremented by 1.

On updating a thread

- The `/editThread` api will trigger and the response will be updated in the `store` and `listingStore` substores in the `threads.ts` store in a merger way.

On deleting a thread

- The `/deleteThread` api will remove the thread from api, on the frontend we remove the thread from `listingStore`, `overviewStore` and the `store` substores in the `threads.ts` store. We also decrement the `app.threads.numTotalThreads` by 1.

On reaction

- Adding a reaction will trigger `/createReaction` api that will add a reaction for the current user, the newly added reaction is added to the `reactionCounts.ts` store and again is used in different parts of the app for reaction counts. If the reaction is already in store (this can happen is user is using 2 tabs and adds a reaction from another tab) then we update it in the store.
- Removing a reaction will trigger `/deleteReaction` api that removes the reaction for the current user. This reaction is also removed from the `reactionCounts.ts` store.

On updating a thread topic

- The `/updateTopic` will trigger and on response, the `store` substore in `threads.ts` will be updated with the newly selected topic for the active thread

On updating a thread privacy

- The `/updateThreadPrivacy` will trigger and on response, the `store`, `listingStore` and `overview` substore in `threads.ts` will update the newly set privacy status of the thread.

On pinning a thread

- The `/updateThreadPinned` will trigger and on response, the `listingStore` substore in `thread.ts` will update the newly set pinned status for the thread.

On updating a thread stage

- The `/updateThreadStage` will trigger and on response, the `store` and `listingStore` substore in `thread.ts` will update the newly set stage for the thread.

On comment

- Adding a comment will trigger `/createComment` and on response we increment the `numOfComments` for the thread in the `store` substore in `threads.ts`
- Removing a comment will trigger `/deleteComment` and on response we decrement the `numOfComments` for the thread in the `store` substore in `threads.ts`

On poll

- The `/GET threads/:id/polls` api will trigger on visit to the thread view page and on response we update the local state of the thread view page.
- On the `POST /threads/:id/polls` api response we update the thread with the active poll status + the `polls.ts` store. This api is triggered from the thread view page.
- On the `DELETE /polls/:id` api response we update the `polls.ts` store. This api is triggered from the thread view page.

On thread linking

- The `linking/getLinks` will get triggered on the view threads page. The response is stored in local component state
- The `linking/addThreadLinks` will add a linked thread to the current thread. The updated state is reflected in the `listingStore` in `threads.ts`
- The `linking/deleteLinks` will remove a linked thread from the current thread. The updated state is reflected in the `listingStore` in `threads.ts`
