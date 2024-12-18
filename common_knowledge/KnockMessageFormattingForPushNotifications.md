
# comment-created

Works!

```json
{
  "data": {
    "knock_message_id": "2oDUVp04jploAbYiUy5pQpAQaMc",
    "comment_created_event.updated_at": "2024-10-31T19:41:03.679Z",
    "community_name": "test",
    "comment_created_event.parent_id": "",
    "comment_created_event.reaction_weights_sum": "0",
    "comment_created_event.reaction_count": "0",
    "comment_created_event.canvas_msg_id": "",
    "comment_created_event.content_url": "",
    "comment_url": "http://localhost:8080/test/discussion/9?comment=12",
    "comment_created_event.deleted_at": "",
    "comment_created_event.discord_meta": "",
    "comment_created_event.id": "12",
    "comment_created_event.created_by": "",
    "comment_created_event.marked_as_spam_at": "",
    "comment_created_event.created_at": "2024-10-31T19:41:03.679Z",
    "comment_created_event.canvas_signed_data": "",
    "comment_created_event.body": "another test",
    "comment_created_event.address_id": "5",
    "comment_body": "another test",
    "comment_parent_name": "thread",
    "comment_created_event.thread_id": "9",
    "comment_created_event.community_id": "test",
    "author": "inputneuron"
  },
  "from": "158803639844",
  "priority": "normal",
  "notification": {
    "title": "inputneuron replied to your thread in test",
    "body": "another test"
  },
  "fcmMessageId": "d57771cf-00d0-49ba-925e-8ded44ee6539"
}
```


# user-mentioned

Works!

```json
{
  "data": {
    "object_url": "http://localhost:8080/test/discussion/9?comment=14",
    "community_name": "test",
    "community_id": "test",
    "object_body": "[@asdf](/profile/id/2) another user mention...",
    "author_address_id": "5",
    "knock_message_id": "2oDUusCVR6gJMz1U6Tioei1watb",
    "author_user_id": "3",
    "author": "inputneuron",
    "author_address": "0xA78968FCe17428068c128B2aFfddaABeeA83077B"
  },
  "from": "158803639844",
  "priority": "normal",
  "notification": {
    "title": "inputneuron mentioned you in test",
    "body": "[@asdf](/profile/id/2) another user mention..."
  },
  "fcmMessageId": "2a147c6d-fc6b-440d-a956-af128153c79e"
}
```


# community-stake

No messages being sent.

```json
{
  "data": {
    "community_id": "sushi-contest-test",
    "community_name": "Sushi Contest Test",
    "community_stakes_url": "https://commonwealth.im/sushi-contest-test",
    "transaction_type": "burned"
  },
  "recipients": [
    {
      "id": "100082"
    },
    {
      "id": "123426"
    },
    {
      "id": "144062"
    },
    {
      "id": "15164"
    }
  ]
}
```

# new-upvote

NOT being sent.

```json
{
  "data": {
    "comment_body": "asdasdasd",
    "comment_id": 88944,
    "community_id": "ilija",
    "community_name": "ilija",
    "created_at": "2024-10-31T17:13:47.117Z",
    "object_url": "https://commonwealth.im/ilija/discussion/25424?comment=88944",
    "reaction": "like"
  },
  "recipients": [
    {
      "id": "157377"
    }
  ]
}
```
