"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RascalRoutingKeys = exports.RascalBindings = exports.RascalQueues = exports.RascalExchanges = exports.RascalSubscriptions = exports.RascalPublications = exports.RmqMsgFormatError = void 0;
__exportStar(require("./ChainEvents"), exports);
__exportStar(require("./ChainEventNotification"), exports);
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
    RascalPublications["ChainEvents"] = "ChainEventsPublication";
    RascalPublications["ChainEventNotifications"] = "ChainEventNotificationsPublication";
    RascalPublications["SubstrateIdentityEvents"] = "SubstrateIdentityEventsPublication";
    RascalPublications["SnapshotListener"] = "SnapshotListenerPublication";
})(RascalPublications = exports.RascalPublications || (exports.RascalPublications = {}));
var RascalSubscriptions;
(function (RascalSubscriptions) {
    RascalSubscriptions["ChainEvents"] = "ChainEventsSubscription";
    RascalSubscriptions["ChainEventNotifications"] = "ChainEventNotificationsSubscription";
    RascalSubscriptions["SubstrateIdentityEvents"] = "SubstrateIdentityEventsSubscription";
    RascalSubscriptions["SnapshotListener"] = "SnapshotListenerSubscription";
})(RascalSubscriptions = exports.RascalSubscriptions || (exports.RascalSubscriptions = {}));
var RascalExchanges;
(function (RascalExchanges) {
    RascalExchanges["ChainEvents"] = "ChainEventsExchange";
    RascalExchanges["Notifications"] = "NotificationsExchange";
    RascalExchanges["SnapshotListener"] = "SnapshotListenerExchange";
    RascalExchanges["DeadLetter"] = "DeadLetterExchange";
})(RascalExchanges = exports.RascalExchanges || (exports.RascalExchanges = {}));
var RascalQueues;
(function (RascalQueues) {
    RascalQueues["ChainEvents"] = "ChainEventsQueue";
    RascalQueues["ChainEventNotifications"] = "ChainEventNotificationsQueue";
    RascalQueues["SnapshotListener"] = "SnapshotListenerQueue";
    RascalQueues["DeadLetter"] = "DeadLetterQueue";
    RascalQueues["SubstrateIdentityEvents"] = "SubstrateIdentityEventsQueue";
})(RascalQueues = exports.RascalQueues || (exports.RascalQueues = {}));
var RascalBindings;
(function (RascalBindings) {
    RascalBindings["ChainEvents"] = "ChainEventsBinding";
    RascalBindings["ChainEventNotifications"] = "ChainEventNotificationsBinding";
    RascalBindings["SubstrateIdentityEvents"] = "SubstrateIdentityEventsBinding";
    RascalBindings["SnapshotListener"] = "SnapshotListenerBinding";
    RascalBindings["DeadLetter"] = "DeadLetterBinding";
})(RascalBindings = exports.RascalBindings || (exports.RascalBindings = {}));
var RascalRoutingKeys;
(function (RascalRoutingKeys) {
    RascalRoutingKeys["ChainEvents"] = "ChainEvents";
    RascalRoutingKeys["ChainEventNotifications"] = "ChainEventNotifications";
    RascalRoutingKeys["SubstrateIdentityEvents"] = "SubstrateIdentityEvents";
    RascalRoutingKeys["SnapshotListener"] = "SnapshotListener";
    RascalRoutingKeys["DeadLetter"] = "deadLetter";
})(RascalRoutingKeys = exports.RascalRoutingKeys || (exports.RascalRoutingKeys = {}));
