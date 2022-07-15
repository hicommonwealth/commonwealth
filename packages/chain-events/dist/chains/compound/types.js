"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventKinds = exports.EventKind = exports.EntityKind = exports.isGovernorAlpha = exports.BravoSupport = exports.ProposalState = void 0;
var ProposalState;
(function (ProposalState) {
    ProposalState[ProposalState["Pending"] = 0] = "Pending";
    ProposalState[ProposalState["Active"] = 1] = "Active";
    ProposalState[ProposalState["Canceled"] = 2] = "Canceled";
    ProposalState[ProposalState["Defeated"] = 3] = "Defeated";
    ProposalState[ProposalState["Succeeded"] = 4] = "Succeeded";
    ProposalState[ProposalState["Queued"] = 5] = "Queued";
    ProposalState[ProposalState["Expired"] = 6] = "Expired";
    ProposalState[ProposalState["Executed"] = 7] = "Executed";
})(ProposalState = exports.ProposalState || (exports.ProposalState = {}));
var BravoSupport;
(function (BravoSupport) {
    BravoSupport[BravoSupport["Against"] = 0] = "Against";
    BravoSupport[BravoSupport["For"] = 1] = "For";
    BravoSupport[BravoSupport["Abstain"] = 2] = "Abstain";
})(BravoSupport = exports.BravoSupport || (exports.BravoSupport = {}));
function isGovernorAlpha(a) {
    return !!a.interface.functions['guardian()'];
}
exports.isGovernorAlpha = isGovernorAlpha;
// eslint-disable-next-line no-shadow
var EntityKind;
(function (EntityKind) {
    // eslint-disable-next-line no-shadow
    EntityKind["Proposal"] = "proposal";
})(EntityKind = exports.EntityKind || (exports.EntityKind = {}));
var EventKind;
(function (EventKind) {
    EventKind["ProposalExecuted"] = "proposal-executed";
    EventKind["ProposalCreated"] = "proposal-created";
    EventKind["ProposalCanceled"] = "proposal-canceled";
    EventKind["ProposalQueued"] = "proposal-queued";
    EventKind["VoteCast"] = "vote-cast";
})(EventKind = exports.EventKind || (exports.EventKind = {}));
exports.EventKinds = Object.values(EventKind);
//# sourceMappingURL=types.js.map