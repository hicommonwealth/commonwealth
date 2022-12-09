"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RascalRoutingKeys = exports.RascalBindings = exports.RascalQueues = exports.RascalExchanges = exports.RascalSubscriptions = exports.RascalPublications = exports.RmqMsgFormatError = void 0;
__exportStar(require("./chainEntityCUD"), exports);
__exportStar(require("./chainEventNotificationsCUD"), exports);
__exportStar(require("./chainEventTypeCUD"), exports);
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
    RascalPublications["ChainEntityCUDMain"] = "ChainEntityCUDMainPublication";
    RascalPublications["ChainEventNotificationsCUDMain"] = "ChainEventNotificationsCUDMainPublication";
    RascalPublications["ChainEventNotifications"] = "ChainEventNotificationsPublication";
    RascalPublications["ChainEventTypeCUDMain"] = "ChainEventTypeCUDMainPublication";
})(RascalPublications = exports.RascalPublications || (exports.RascalPublications = {}));
var RascalSubscriptions;
(function (RascalSubscriptions) {
    RascalSubscriptions["ChainEvents"] = "ChainEventsSubscription";
    RascalSubscriptions["ChainEntityCUDMain"] = "ChainEntityCUDMainSubscription";
    RascalSubscriptions["ChainEventNotificationsCUDMain"] = "ChainEventNotificationsCUDSubscription";
    RascalSubscriptions["ChainEventNotifications"] = "ChainEventNotificationsSubscription";
    RascalSubscriptions["ChainEventTypeCUDMain"] = "ChainEventTypeCUDMainSubscription";
})(RascalSubscriptions = exports.RascalSubscriptions || (exports.RascalSubscriptions = {}));
var RascalExchanges;
(function (RascalExchanges) {
    RascalExchanges["ChainEvents"] = "ChainEventsExchange";
    RascalExchanges["CUD"] = "CreateUpdateDeleteExchange";
    RascalExchanges["Notifications"] = "NotificationsExchange";
    RascalExchanges["DeadLetter"] = "DeadLetterExchange";
})(RascalExchanges = exports.RascalExchanges || (exports.RascalExchanges = {}));
var RascalQueues;
(function (RascalQueues) {
    RascalQueues["ChainEvents"] = "ChainEventsQueue";
    RascalQueues["ChainEntityCUDMain"] = "ChainEntityCUDMainQueue";
    RascalQueues["ChainEventNotificationsCUDMain"] = "ChainEventNotificationsCUDMainQueue";
    RascalQueues["ChainEventNotifications"] = "ChainEventNotificationsQueue";
    RascalQueues["ChainEventTypeCUDMain"] = "ChainEventTypeCUDMainQueue";
    RascalQueues["DeadLetter"] = "DeadLetterQueue";
})(RascalQueues = exports.RascalQueues || (exports.RascalQueues = {}));
var RascalBindings;
(function (RascalBindings) {
    RascalBindings["ChainEvents"] = "ChainEventsBinding";
    RascalBindings["ChainEntityCUDMain"] = "ChainEntityCUDMainBinding";
    RascalBindings["ChainEventNotificationsCUD"] = "ChainEventNotificationsCUDBinding";
    RascalBindings["ChainEventNotifications"] = "ChainEventNotificationsBinding";
    RascalBindings["ChainEventType"] = "ChainEventTypeBinding";
    RascalBindings["DeadLetter"] = "DeadLetterBinding";
})(RascalBindings = exports.RascalBindings || (exports.RascalBindings = {}));
var RascalRoutingKeys;
(function (RascalRoutingKeys) {
    RascalRoutingKeys["ChainEvents"] = "ChainEvents";
    RascalRoutingKeys["ChainEntityCUD"] = "ChainEntityCUD";
    RascalRoutingKeys["ChainEventNotificationsCUD"] = "ChainEventNotificationsCUD";
    RascalRoutingKeys["ChainEventNotifications"] = "ChainEventNotifications";
    RascalRoutingKeys["ChainEventTypeCUD"] = "ChainEventTypeCUD";
    RascalRoutingKeys["DeadLetter"] = "deadLetter";
})(RascalRoutingKeys = exports.RascalRoutingKeys || (exports.RascalRoutingKeys = {}));
