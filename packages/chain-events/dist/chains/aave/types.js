"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventKinds = exports.DelegationType = exports.ProposalState = exports.EventKind = exports.EntityKind = void 0;
// eslint-disable-next-line no-shadow
var EntityKind;
(function (EntityKind) {
    // eslint-disable-next-line no-shadow
    EntityKind["Proposal"] = "proposal";
})(EntityKind = exports.EntityKind || (exports.EntityKind = {}));
// eslint-disable-next-line no-shadow
var EventKind;
(function (EventKind) {
    // governance
    EventKind["ProposalCanceled"] = "proposal-canceled";
    EventKind["ProposalCreated"] = "proposal-created";
    EventKind["ProposalExecuted"] = "proposal-executed";
    EventKind["ProposalQueued"] = "proposal-queued";
    EventKind["VoteEmitted"] = "vote-emitted";
    // tokens
    EventKind["DelegateChanged"] = "delegate-changed";
    EventKind["DelegatedPowerChanged"] = "delegated-power-changed";
    EventKind["Transfer"] = "transfer";
    EventKind["Approval"] = "approval";
})(EventKind = exports.EventKind || (exports.EventKind = {}));
// eslint-disable-next-line no-shadow
var ProposalState;
(function (ProposalState) {
    ProposalState[ProposalState["PENDING"] = 0] = "PENDING";
    ProposalState[ProposalState["CANCELED"] = 1] = "CANCELED";
    ProposalState[ProposalState["ACTIVE"] = 2] = "ACTIVE";
    ProposalState[ProposalState["FAILED"] = 3] = "FAILED";
    ProposalState[ProposalState["SUCCEEDED"] = 4] = "SUCCEEDED";
    ProposalState[ProposalState["QUEUED"] = 5] = "QUEUED";
    ProposalState[ProposalState["EXPIRED"] = 6] = "EXPIRED";
    ProposalState[ProposalState["EXECUTED"] = 7] = "EXECUTED";
})(ProposalState = exports.ProposalState || (exports.ProposalState = {}));
// eslint-disable-next-line no-shadow
var DelegationType;
(function (DelegationType) {
    DelegationType[DelegationType["VOTING_POWER"] = 0] = "VOTING_POWER";
    DelegationType[DelegationType["PROPOSITION_POWER"] = 1] = "PROPOSITION_POWER";
})(DelegationType = exports.DelegationType || (exports.DelegationType = {}));
// eslint-disable-next-line semi-style
exports.EventKinds = Object.values(EventKind);
//# sourceMappingURL=types.js.map