"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventKinds = exports.coinToCoins = exports.EventKind = exports.EntityKind = void 0;
// eslint-disable-next-line no-shadow
var EntityKind;
(function (EntityKind) {
    // eslint-disable-next-line no-shadow
    EntityKind["Proposal"] = "proposal";
})(EntityKind = exports.EntityKind || (exports.EntityKind = {}));
// eslint-disable-next-line no-shadow
var EventKind;
(function (EventKind) {
    EventKind["SubmitProposal"] = "msg-submit-proposal";
    EventKind["Deposit"] = "msg-deposit";
    EventKind["Vote"] = "msg-vote";
})(EventKind = exports.EventKind || (exports.EventKind = {}));
function coinToCoins(cs) {
    const res = {};
    for (const c of cs) {
        res[c.denom] = c.amount;
    }
    return res;
}
exports.coinToCoins = coinToCoins;
exports.EventKinds = Object.values(EventKind);
