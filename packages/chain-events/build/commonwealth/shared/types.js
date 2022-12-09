"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicTemplate = exports.PROFILE_NAME_MIN_CHARS = exports.PROFILE_BIO_MAX_CHARS = exports.PROFILE_HEADLINE_MAX_CHARS = exports.PROFILE_NAME_MAX_CHARS = exports.SearchContentType = exports.ContentType = exports.WebsocketEngineEvents = exports.WebsocketNamespaces = exports.WebsocketMessageNames = void 0;
var WebsocketMessageNames;
(function (WebsocketMessageNames) {
    WebsocketMessageNames["ChainEventNotification"] = "chain-event-notification";
    WebsocketMessageNames["NewSubscriptions"] = "new-subscriptions";
    WebsocketMessageNames["DeleteSubscriptions"] = "delete-subscriptions";
    WebsocketMessageNames["ChatMessage"] = "chat-message";
    WebsocketMessageNames["JoinChatChannel"] = "join-chat-channel";
    WebsocketMessageNames["LeaveChatChannel"] = "leave-chat-channel";
    WebsocketMessageNames["Error"] = "exception";
})(WebsocketMessageNames = exports.WebsocketMessageNames || (exports.WebsocketMessageNames = {}));
var WebsocketNamespaces;
(function (WebsocketNamespaces) {
    WebsocketNamespaces["ChainEvents"] = "chain-events";
    WebsocketNamespaces["Chat"] = "chat";
})(WebsocketNamespaces = exports.WebsocketNamespaces || (exports.WebsocketNamespaces = {}));
var WebsocketEngineEvents;
(function (WebsocketEngineEvents) {
    WebsocketEngineEvents["CreateRoom"] = "create-room";
    WebsocketEngineEvents["DeleteRoom"] = "delete-room";
})(WebsocketEngineEvents = exports.WebsocketEngineEvents || (exports.WebsocketEngineEvents = {}));
var ContentType;
(function (ContentType) {
    ContentType["Thread"] = "thread";
    ContentType["Comment"] = "comment";
    // Proposal = 'proposal',
})(ContentType = exports.ContentType || (exports.ContentType = {}));
var SearchContentType;
(function (SearchContentType) {
    SearchContentType["Thread"] = "thread";
    SearchContentType["Comment"] = "comment";
    SearchContentType["Chain"] = "chain";
    SearchContentType["Token"] = "token";
    SearchContentType["Member"] = "member";
})(SearchContentType = exports.SearchContentType || (exports.SearchContentType = {}));
exports.PROFILE_NAME_MAX_CHARS = 40;
exports.PROFILE_HEADLINE_MAX_CHARS = 80;
exports.PROFILE_BIO_MAX_CHARS = 1000;
exports.PROFILE_NAME_MIN_CHARS = 3;
exports.DynamicTemplate = {
    ImmediateEmailNotification: 'd-3f30558a95664528a2427b40292fec51',
    BatchNotifications: 'd-468624f3c2d7434c86ae0ed0e1d2227e',
    SignIn: 'd-db52815b5f8647549d1fe6aa703d7274',
    SignUp: 'd-2b00abbf123e4b5981784d17151e86be',
    EmailInvite: 'd-000c08160c07459798b46c927b638b9a',
    UpdateEmail: 'd-a0c28546fecc49fb80a3ba9e535bff48',
    VerifyAddress: 'd-292c161f1aec4d0e98a0bf8d6d8e42c2',
};
