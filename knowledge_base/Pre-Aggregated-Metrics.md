**Contents**

- [Rationale](#rationale)
  * [Current State](#current-state)
  * [Proposed Implementation Approaches](#proposed-implementation-approaches)
  * [Current Implementation](#current-implementation)
  * [Consequences](#consequences)
- [Change Log](#change-log)

# Rationale

To enhance query performance, we can store certain frequently needed values, like counts, as pre-computed metrics. This method circumvents the need to execute complex and potentially time-consuming aggregations or calculations each time these values are required.

## Current State

So far, we have identified the following metrics:

- "Threads" - `comment_count`, `reaction_count`, `max_not_id`
- "Comments" - `reaction_count`

These metrics are utilized in various ways:

- "Threads", "Comments" - `comment_count`, `reaction_count` (Used in `bulkThreads`, `getThreads`, `activeThreads`)
- "Threads" - `max_not_id` (Used to track the latest notification for a thread in various feeds like `viewUserActivity`, `viewGlobalActivity`)

However, pre-aggregation is not limited to these metrics. Other tables such as "Chain", "Topic", and more, may also experience performance enhancements with similar optimizations.

## Proposed Implementation Approaches

We have two viable strategies to maintain the accuracy of these pre-aggregated metrics:

- **Database Triggers:** Triggers can be set up in the database to update the relevant pre-aggregated metrics whenever a new row is inserted, updated, or deleted in the "Reactions", "Comments", or "Notifications" tables.
- **Application-level Changes:** On the other hand, the updates can be managed at the application level. This could involve adjusting functions like `emitNotifications` to update the pertinent pre-aggregated metrics whenever a new thread, comment, or reaction event is triggered.

## Current Implementation

Presently, our implementation relies on Database triggers. For more detailed information, check the PR here <https://github.com/hicommonwealth/commonwealth/pull/4200>

## Consequences

Integrating pre-aggregated metrics can greatly expedite route queries. This optimization can improve the efficiency of routes such as `viewUserActivity`, `globalUserActivity`, `getThreads`, `bulkThreads`, and `activeThreads`, thereby contributing to a more responsive application and an enhanced user experience.

## Change Log

- 230713: Authored by Nakul Manchanda.
