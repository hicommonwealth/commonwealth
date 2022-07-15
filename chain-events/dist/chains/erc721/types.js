"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventKinds = exports.EventKind = void 0;
// eslint-disable-next-line no-shadow
var EventKind;
(function (EventKind) {
    // Erc721 Events
    EventKind["Approval"] = "approval";
    EventKind["ApprovalForAll"] = "approval for all";
    EventKind["Transfer"] = "transfer";
})(EventKind = exports.EventKind || (exports.EventKind = {}));
exports.EventKinds = Object.values(EventKind);
//# sourceMappingURL=types.js.map