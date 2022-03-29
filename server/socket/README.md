# Websocket Events

### Chain Events
- `newSubscriptions`
  - Used to subscribe to Socket.io chain-event rooms. Each chain-event-type has its own room thus the only data
  in this event is a list of string chain-event-type ids.

- `deleteSubscriptions`
  - Used to unsubscribe/leave Socket.io chain-event rooms. Only data in this event is a list of string
  chain-event-type ids.

- `chain-event-notification`
  - Represents a single chain-event websocket message. The type for these events' data can be found in 
  [types](shared/types.ts)
