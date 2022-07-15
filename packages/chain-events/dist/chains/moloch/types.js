"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventKinds = exports.EventKind = exports.EntityKind = void 0;
// eslint-disable-next-line no-shadow
var EntityKind;
(function (EntityKind) {
    EntityKind["Proposal"] = "proposal";
})(EntityKind = exports.EntityKind || (exports.EntityKind = {}));
// eslint-disable-next-line no-shadow
var EventKind;
(function (EventKind) {
    EventKind["SubmitProposal"] = "submit-proposal";
    EventKind["SubmitVote"] = "submit-vote";
    EventKind["ProcessProposal"] = "process-proposal";
    EventKind["Ragequit"] = "ragequit";
    EventKind["Abort"] = "abort";
    EventKind["UpdateDelegateKey"] = "update-delegate-key";
    EventKind["SummonComplete"] = "summon-complete";
    // TODO: add V2s as needed
})(EventKind = exports.EventKind || (exports.EventKind = {}));
// eslint-disable-next-line semi-style
exports.EventKinds = Object.values(EventKind);
//# sourceMappingURL=types.js.map