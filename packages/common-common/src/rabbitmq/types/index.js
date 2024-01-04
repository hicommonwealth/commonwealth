'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.AbstractRabbitMQController =
  exports.RascalRoutingKeys =
  exports.RascalBindings =
  exports.RascalQueues =
  exports.RascalExchanges =
  exports.RascalSubscriptions =
  exports.RascalPublications =
  exports.RmqMsgFormatError =
    void 0;
/**
 * This error type should be used in tandem with isRmqMsg functions. If this error type is thrown, RabbitMQ
 * will immediately dead-letter the message in question instead of using the requeue strategy.
 */
class RmqMsgFormatError extends Error {
  constructor(msg) {
    super(msg);
  }
}
exports.RmqMsgFormatError = RmqMsgFormatError;
var RascalPublications;
(function (RascalPublications) {
  RascalPublications['SnapshotListener'] = 'SnapshotListenerPublication';
  RascalPublications['DiscordListener'] = 'DiscordMessageSubscription';
})(
  RascalPublications || (exports.RascalPublications = RascalPublications = {}),
);
var RascalSubscriptions;
(function (RascalSubscriptions) {
  RascalSubscriptions['SnapshotListener'] = 'SnapshotListenerSubscription';
  RascalSubscriptions['DiscordListener'] = 'DiscordMessageSubscription';
})(
  RascalSubscriptions ||
    (exports.RascalSubscriptions = RascalSubscriptions = {}),
);
var RascalExchanges;
(function (RascalExchanges) {
  RascalExchanges['SnapshotListener'] = 'SnapshotListenerExchange';
  RascalExchanges['DeadLetter'] = 'DeadLetterExchange';
  RascalExchanges['Discobot'] = 'DiscobotExchange';
})(RascalExchanges || (exports.RascalExchanges = RascalExchanges = {}));
var RascalQueues;
(function (RascalQueues) {
  RascalQueues['DeadLetter'] = 'DeadLetterQueue';
  RascalQueues['SnapshotListener'] = 'SnapshotListenerQueueV2';
  RascalQueues['DiscordListener'] = 'DiscordMessageQueueV2';
})(RascalQueues || (exports.RascalQueues = RascalQueues = {}));
var RascalBindings;
(function (RascalBindings) {
  RascalBindings['SnapshotListener'] = 'SnapshotListenerBinding';
  RascalBindings['DeadLetter'] = 'DeadLetterBinding';
  RascalBindings['DiscordListener'] = 'DiscordMessageBinding';
})(RascalBindings || (exports.RascalBindings = RascalBindings = {}));
var RascalRoutingKeys;
(function (RascalRoutingKeys) {
  RascalRoutingKeys['SnapshotListener'] = 'SnapshotListener';
  RascalRoutingKeys['DeadLetter'] = 'DeadLetter';
  RascalRoutingKeys['DiscordListener'] = 'DiscordListener';
})(RascalRoutingKeys || (exports.RascalRoutingKeys = RascalRoutingKeys = {}));
class AbstractRabbitMQController {
  _initialized = false;
  get initialized() {
    return this._initialized;
  }
}
exports.AbstractRabbitMQController = AbstractRabbitMQController;
