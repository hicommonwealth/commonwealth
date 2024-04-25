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
- [Limitations](#limitations)
  * [Current Limitations and Proposed Solutions](#current-limitations-and-proposed-solutions)
- [Proposed Architecture](#proposed-architecture)
  * [Highlights of the new architecture](#highlights-of-the-new-architecture)
- [Implementation](#implementation)
  * [Kafka as a pub/sub queuing solution](#kafka-as-a-pubsub-queuing-solution)
  * [Apache Beam - Flink Runner](#apache-beam---flink-runner)
  * [High-Level Pipeline with Kafka & Beam](#high-level-pipeline-with-kafka--beam)
  * [Proposed Schema](#proposed-schema)
  * [SQL Data Types](#sql-data-types)
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

## Limitations

### Current Limitations and Proposed Solutions

- **Managing subscriptions at a low level:** The current implementation directly interacts with subscriptions rather than a subscription manager, which is inefficient.
  - **Proposed Solution:** Develop a high-level subscription manager to handle subscriptions, which will be configurable and provide reusable functionality between events. This could potentially be offloaded to a separate worker.
- **Notification emission is overloaded:** All processes such as sending emails and pushing notifications are handled on the main server.
  - **Proposed Solution:** Offload some of these tasks to worker nodes.
- **Creation of notifications for each user:** The fan-out step is slow, taking up to 4-10 minutes for this query to complete.
  - **Proposed Solution:** Address the issue of this being one of the slowest queries in the database that monopolizes database connections.
- **NotificationsRead:** With up to 20 million rows, it is slow to work even for basic get queries.
  - **Proposed Solution:** Implement an archiving strategy to manage the large amount of data.
- **`viewSubscriptions`:** This function is slow and frequently called.
  - **Proposed Solution:** Optimize the process to prevent pulling 11.2MB of unnecessary data.
- **Manage Subscriptions User Interface:** This tries to list all the threads, comments, and reactions for users to unsubscribe.
  - **Proposed Solution:** Increase the granularity of data displayed to users by using a hierarchy in objects such as thread_id, comment_id, chain, author_id, etc.
- **Socket.io room management:** The constant creation and maintenance of many rooms is not a sustainable strategy.
  - **Proposed Solution:** Maintain one websocket per user - with the current number of online users, looping through users can be accomplished easily.
- **Maintaining offsets for users in NotificationsRead:** This process results in slow and messy insert queries and is prone to race conditions, leading to duplicates in the database.
  - **Proposed Solution:** Given the limited benefits, an offset strategy could be abandoned in favor of a robust archiving strategy, which would make the table smaller and queries faster.

## Proposed Architecture

<img width="522" alt="image" src="https://github.com/hicommonwealth/commonwealth/assets/4791635/22185fdd-77f8-44d1-b022-70a05e203ce3">

### Highlights of the new architecture

- **Subscription Management Enhancement:** In the new architecture, the subscription management has been extracted from the current application and turned into an initial service that consumes events. This modification reduces the load on the current system. It generates new subscription objects and manages other subscription related activities, including the fanout process which will be handled by stored procedure in Database.

- **Decomposition of emitNotification:** The emitNotification function has been restructured to a worker service

- **Plug-in Architecture:** Using Kafka Topics to allows the subscription of new delivery methods and services by adding new consumers to the Kafka topic as needed.

## Implementation

The implementation will involve two elements:

- Event (current notification)
- Notification (current NotificationRead)

### Kafka as a pub/sub queuing solution

A comparison of RabbitMQ and Kafka can be found here: <https://www.cloudamqp.com/blog/when-to-use-rabbitmq-or-apache-kafka.html>. In summary, RabbitMQ messages are not available for another consumer/subscriber once read, whereas Kafka preserves messages and maintains offsets for each type of consumer. Kafka is natively supported on Heroku and can be shared between projects. In a simplified design, only two Kafka topics are needed: one for CDC Event (Notification) and the other for Notification (NotificationRead).

### Apache Beam - Flink Runner

- It can be used to offload worker nodes logic.
- They provide scalable computing power so messages can be read once off the queue and processed via a beam DAG.
- The Beam DAG reads the message, sends emails, pushes notifications, and pushes the main server for websockets.

### High-Level Pipeline with Kafka & Beam

The flow of data can be described as follows:

- **DB changes => Kafka => processing with flink/beam/or Node.js worker(s)**
- Kafka just provides offset management for consumer(s)
- **Reliability:** It offers reliability to the system in case of beam failure
- **Extensibility:** It offers extensibility as it can be subscribed by internal & external services interested in the events eg discobot.

### Proposed Schema

One of the main objectives of implementing the new schema is to **enhance its configurability for third-party developers.**
This modification will enable developers (both internal & third party developers) to effortlessly incorporate new events into the system.

<img width="731" alt="image" src="https://github.com/hicommonwealth/commonwealth/assets/4791635/720be932-7709-4f04-90fc-5dce336821cc">

- **Event Category:**
  - **(category_id, category_label, new_topic(s), target_user_list)**
  - This is the configuration layer - a high-level classification of how to process events. It contains rules to abstract new unique object ids to create out of payload and a query to find the target user list that should be informed.
- **Object:**
  - **(object_id, hierarchy, templated_queries(s), parse_user_from_payload)**
  - hierarchy - chain_id.thread_id.comment_id
  - This includes any possible event stream which can be subscribed. It contains a list of attributes or a custom method to extract the user based on the payload.
- **Templated_queries:**
  - **(template_id, query)**
  - These are templated/reusable queries.
  - Examples include
    - getAdmins(chain_id) which extracts the chain_id from the payload,
    - and getCommenters(thread_id) which extracts the thread_id from the payload.
- **Subscriptions:**
  - **(object_id, include_user_list, exclude_user_list)**
- **Event:**
  - **(event_id, payload)**
  - This should map to event category => topic, target user list.
- **Notifications:**
  - **(event_id, user_id, read_ind)**
  - Notifications per user
  - It will track read/unread notifications

### SQL Data Types

**Event Category:**  
category_id: INTEGER or BIGINT (Primary Key, Auto-Increment)  
category_label: VARCHAR(255)  
new_topic(s): [jsonb array] {object_id, object_type, templated_query}  
target_user_list: [text array]

**Object:**  
object_id: INTEGER or BIGINT (Primary Key, Auto-Increment)  
hierarchy: VARCHAR(255)  
templated_queries(s):[text array]  
parse_user_from_payload: TEXT

**templated_queries:**  
template_id: INTEGER or BIGINT (Primary Key, Auto-Increment)
template_label: TEXT  
query: TEXT

**Subscriptions:**  
object_id: INTEGER or BIGINT (Foreign Key, references Object.object_id)  
include_user_list: [text array]  
exclude_user_list: [text array]

**Event:**  
event_id: INTEGER or BIGINT (Primary Key, Auto-Increment)  
payload: JSONB

**Notifications:**  
event_id: INTEGER or BIGINT (Foreign Key, references Event.event_id)  
user_id: INTEGER or BIGINT  
read_ind: BOOLEAN

## Change Log

- 230628: Authored by Nakul Manchanda.
