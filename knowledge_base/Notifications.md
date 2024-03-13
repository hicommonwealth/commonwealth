# Notifications

## Contents

- [Current Setup](#current-setup)
  * [Supported User Scenarios](#supported-user-scenarios)
  * [Current Database Schema](#current-database-schema)
- [Current Implementation](#current-implementation)
  * [Creation of New Objects within the System](#creation-of-new-objects-within-the-system)
  * [Subscriptions](#subscriptions)
  * [Notification Emission - emitNotification](#notification-emission---emitnotification)
  * [Websocket - Push Notification for Online Users](#websocket---push-notification-for-online-users)
- [Change Log](#change-log)

## Current Setup

### Supported User Scenarios

The current setup supports the following user scenarios:

- **Get Notifications:** Retrieval of notifications
- **Get Unread Notifications:** Tracking of read and unread notifications
- **View Subscriptions:** Viewing of subscriptions
- **System-managed subscriptions:** User does not subscribe to anything, the system will determine the appropriate subscriptions for the user.
- **Un-Subscribe:** Users can unsubscribe from content.
- **Automatic system subscriptions:** For instance, when a new entity/object is created, based on the user's associated communities and roles, such as being an administrator, the user is subscribed to the new object.
- **Automatic system un-subscriptions:** This occurs when a user's role changes, such as no longer being an administrator, which would mean the user should no longer receive admin-level notifications.

### Current Database Schema

Upon the creation of a new entity/object within the system, such as a new thread, comment, or reaction, a unique object id is assigned to that entity/object. This setup involves:

- **NotificationsCategory**, classify notifications(events) into possible categories
- **Subscriptions**, which map each user to an object_id
- **Notifications**, which store all events that should be notified to platform users if they are subscribed
- **NotificationsRead**, which maps notifications to subscriptions and users and tracks read/unread notifications per user

## Current Implementation

### Creation of New Objects within the System

Here is an example of the steps taken to create a new thread:

```txt
...execute new thread creation business logic
...manage subscription business logic
...emit notification
```

### Subscriptions

- The subscription logic is integrated with the business logic of the app. In some cases, this co-location can affect performance if executed in a blocking manner.

### Notification Emission - emitNotification

This process typically involves three to four steps:

- Creation of a notification
- Creation of notifications for each user (a fan-out process), which involves joining subscriptions and notifications to determine which users should be notified
- Sending emails to the users identified in step two
- Pushing notifications to online users

### Websocket - Push Notification for Online Users

- The system uses socket.io to broadcast messages to users
- A new room is created for every existing/new object in the system
- Notifications are pushed to online users via websockets, wherein each online user is subscribed to objects, based on which a room is subscribed for that object_id. A message is published to the room and is broadcasted to all subscribed users in the room.

## Change Log

- 230628: Authored by Nakul Manchanda.
