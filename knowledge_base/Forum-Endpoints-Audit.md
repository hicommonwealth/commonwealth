# Audit

Key:
📄 = Create
👁 = Read
✏️ = Update
❌  = Delete

## Threads

- 📄`/createThread`
  - Will upsert topic, create thread, create attachments, and update author `last_active` timestamp, then creates subscription between author and thread comments/reactions.
- 👁️ `/getThreads`
  - With thread IDs passed via query params, will return specified threads with related collaborator addresses, topic and reactions.
- ✏️ `/editThread`
  - Updates thread and adds new body to thread version history, then creates new file attachments, emits notification to subscribers for the `ThreadEdit` event, then emits the `NewMention` event to newly mentioned users.
  - Suggestions:
    - DB operations should be wrapped in a transaction.
    - There's a TODO item to update the author's `last_active` timestamp– should implement.
- ❌ `/deleteThread`
  - Deletes thread subscription and thread.
- 👁 `/bulkThreads`
  - With a cuttoff date passed via query params, will return up to 20 threads before the cutoff date– each thread includes links, collaborators, reactions and topic.
- 👁 `/activeThreads`
  - With number of threads-per-topic passed via query params, returns most recently created/commented threads (with comment counts) for all topics within the specified chain.
- 👁 `/searchDiscussions`
  - With a search term passed via query params, returns threads with matching search index data.

## Comments

- 📄`/createComment`
  - With parent comment ID, thread ID and text passed via body, creates a comment and attachments, creates subscription between author and reactions/comments, emits `NewMention` notification to new mentions, then updates author `last_active` timestamp and thread `last_commented_on` timestamp.
- 👁 `/viewComments`
  - With thread ID passed via query params, will return all comments for the specified thread/chain, starting with the most recent.
  - Suggestion:
    - With some threads potentially having many comments, perhaps this should be paginated.
- ✏️ `/editComment`
  - Updates comment, adds attachments, emits `CommentEdit` notification
- ❌ `/deleteComment`
  - With comment ID, will delete comment subscription and comment.
- 👁 `/bulkComments`
  - Returns all comments by chain ID.
  - Suggestions:
    - This endpoint is not used by the frontend and can be removed.
- 👁 `/searchComments`
  - With a search term passed via query params, returns comments with matching search index data.

## Reactions

- 📄`/createReaction`
  - Upserts a reaction by thread ID or proposal ID or comment ID
- 👁 `/viewReactions`
  - Returns all reactions given a thread ID or comment ID
- ❌ `/deleteReaction`
  - Deletes reaction by ID
- 👁 `/bulkReactions`
  - Returns all reactions by thread ID or proposal ID or comment ID
- 👁 `/reactionsCounts`
  - Returns all counts of reactions given a list of thread IDs, comment IDs and proposal IDs

# General Suggestions (230522)

- Found a common pattern where the user's `last_active` column is updated when various actions are performed. Change into a middleware or helper utility function?
- Found a common pattern where the text of a thread/comment is parsed for mentions and new mentions are notified. Move logic into helper utility function?

## Change Log

- 230522: Authored by Ryan Bennett
