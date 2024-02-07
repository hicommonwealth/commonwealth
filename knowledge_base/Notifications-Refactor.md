**Contents**

- [Notifications Refactor](#notifications-refactor)
  * [Refactor Proposals](#refactor-proposals)
- [Change Log](#change-log)

# Notifications Refactor

- The refactor aims to keep Notifications functional.
- AWS will facilitate push notifications in the initial phase.

## Refactor Proposals

**Assumption:**

- Current tables, including Notification, NotificationRead, Subscription, and NotificationCategory, will remain.

1. **Schema Change - NotificationRead**
   - Remove Offset column to eliminate the bottleneck.
   - Simplify notification insertion.
   - Existing or new tests should confirm existing functionality.
   - Performance testing for viewSubscription/viewNotification will measure the performance impact of column removal.

2. **New Subscription Manager**
   - Relocate Subscription Management Logic to a new manager.
   - Introduce named queries.
   - Refactor request handler to call the subscription manager instead of implementing inline subscription changes.

3. **Broken Down EmitNotification**

- EmitNotification to be called asynchronously post request handler for background processing.
- Existing Tasks:
  - Notification creation.
  - Per-user notification creation.
  - Email and websocket dispatch.
- Refactored Tasks:
  - Notification creation now posts message to RabbitMQ.
  - New subscription manager described above will lead to per-user notification creation following user listing.
  - Single message posted to RabbitMQ for consumption by multiple workers.
  - All workers extract per-user notification from the database.
    - Notification enhancement with thread/comment details.
    - Email Worker - dispatches emails.
    - Websocket Main server - retrieves notifications for in-app delivery to online users.
    - Push Notification Worker - posts enriched message to SNS using AWS topic ARN.

## Change Log

- 230731: Authored by Nakul Manchanda.
