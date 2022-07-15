"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventKinds = exports.EventKind = exports.isEvent = exports.EntityKind = exports.parseJudgement = exports.IdentityJudgement = void 0;
// eslint-disable-next-line no-shadow
var IdentityJudgement;
(function (IdentityJudgement) {
    IdentityJudgement["Unknown"] = "unknown";
    IdentityJudgement["FeePaid"] = "fee-paid";
    IdentityJudgement["Reasonable"] = "reasonable";
    IdentityJudgement["KnownGood"] = "known-good";
    IdentityJudgement["OutOfDate"] = "out-of-date";
    IdentityJudgement["LowQuality"] = "low-quality";
    IdentityJudgement["Erroneous"] = "erroneous";
})(IdentityJudgement = exports.IdentityJudgement || (exports.IdentityJudgement = {}));
function parseJudgement(j) {
    if (j.isFeePaid)
        return IdentityJudgement.FeePaid;
    if (j.isReasonable)
        return IdentityJudgement.Reasonable;
    if (j.isKnownGood)
        return IdentityJudgement.KnownGood;
    if (j.isOutOfDate)
        return IdentityJudgement.OutOfDate;
    if (j.isLowQuality)
        return IdentityJudgement.LowQuality;
    if (j.isErroneous)
        return IdentityJudgement.Erroneous;
    return IdentityJudgement.Unknown;
}
exports.parseJudgement = parseJudgement;
// Used for grouping EventKinds together for archival purposes
// eslint-disable-next-line no-shadow
var EntityKind;
(function (EntityKind) {
    EntityKind["DemocracyProposal"] = "democracy-proposal";
    EntityKind["DemocracyReferendum"] = "democracy-referendum";
    EntityKind["DemocracyPreimage"] = "democracy-preimage";
    EntityKind["TreasuryProposal"] = "treasury-proposal";
    EntityKind["CollectiveProposal"] = "collective-proposal";
    EntityKind["SignalingProposal"] = "signaling-proposal";
    EntityKind["TipProposal"] = "tip-proposal";
    EntityKind["TreasuryBounty"] = "treasury-bounty";
})(EntityKind = exports.EntityKind || (exports.EntityKind = {}));
// Each kind of event we handle
// In theory we could use a higher level type-guard here, like
// `e instanceof GenericEvent`, but that makes unit testing
// more difficult, as we need to then mock the original constructor.
function isEvent(e) {
    return !(e.data instanceof Uint8Array);
}
exports.isEvent = isEvent;
// eslint-disable-next-line no-shadow
var EventKind;
(function (EventKind) {
    EventKind["Slash"] = "slash";
    EventKind["Reward"] = "reward";
    EventKind["Bonded"] = "bonded";
    EventKind["Unbonded"] = "unbonded";
    EventKind["BalanceTransfer"] = "balance-transfer";
    EventKind["StakingElection"] = "staking-election";
    EventKind["VoteDelegated"] = "vote-delegated";
    EventKind["DemocracyProposed"] = "democracy-proposed";
    EventKind["DemocracySeconded"] = "democracy-seconded";
    EventKind["DemocracyTabled"] = "democracy-tabled";
    EventKind["DemocracyStarted"] = "democracy-started";
    EventKind["DemocracyVoted"] = "democracy-voted";
    EventKind["DemocracyPassed"] = "democracy-passed";
    EventKind["DemocracyNotPassed"] = "democracy-not-passed";
    EventKind["DemocracyCancelled"] = "democracy-cancelled";
    EventKind["DemocracyExecuted"] = "democracy-executed";
    EventKind["PreimageNoted"] = "preimage-noted";
    EventKind["PreimageUsed"] = "preimage-used";
    EventKind["PreimageInvalid"] = "preimage-invalid";
    EventKind["PreimageMissing"] = "preimage-missing";
    EventKind["PreimageReaped"] = "preimage-reaped";
    EventKind["TreasuryProposed"] = "treasury-proposed";
    EventKind["TreasuryAwarded"] = "treasury-awarded";
    EventKind["TreasuryRejected"] = "treasury-rejected";
    EventKind["TreasuryBountyProposed"] = "treasury-bounty-proposed";
    EventKind["TreasuryBountyAwarded"] = "treasury-bounty-awarded";
    EventKind["TreasuryBountyRejected"] = "treasury-bounty-rejected";
    EventKind["TreasuryBountyBecameActive"] = "treasury-bounty-became-active";
    EventKind["TreasuryBountyClaimed"] = "treasury-bounty-claimed";
    EventKind["TreasuryBountyCanceled"] = "treasury-bounty-canceled";
    EventKind["TreasuryBountyExtended"] = "treasury-bounty-extended";
    EventKind["NewTip"] = "new-tip";
    EventKind["TipVoted"] = "tip-voted";
    EventKind["TipClosing"] = "tip-closing";
    EventKind["TipClosed"] = "tip-closed";
    EventKind["TipRetracted"] = "tip-retracted";
    EventKind["TipSlashed"] = "tip-slashed";
    EventKind["ElectionNewTerm"] = "election-new-term";
    EventKind["ElectionEmptyTerm"] = "election-empty-term";
    EventKind["ElectionCandidacySubmitted"] = "election-candidacy-submitted";
    EventKind["ElectionMemberKicked"] = "election-member-kicked";
    EventKind["ElectionMemberRenounced"] = "election-member-renounced";
    EventKind["CollectiveProposed"] = "collective-proposed";
    EventKind["CollectiveVoted"] = "collective-voted";
    EventKind["CollectiveApproved"] = "collective-approved";
    EventKind["CollectiveDisapproved"] = "collective-disapproved";
    EventKind["CollectiveExecuted"] = "collective-executed";
    EventKind["CollectiveMemberExecuted"] = "collective-member-executed";
    // TODO: do we want to track votes as events, in collective?
    EventKind["SignalingNewProposal"] = "signaling-new-proposal";
    EventKind["SignalingCommitStarted"] = "signaling-commit-started";
    EventKind["SignalingVotingStarted"] = "signaling-voting-started";
    EventKind["SignalingVotingCompleted"] = "signaling-voting-completed";
    EventKind["TreasuryRewardMinting"] = "treasury-reward-minting";
    EventKind["TreasuryRewardMintingV2"] = "treasury-reward-minting-v2";
    EventKind["IdentitySet"] = "identity-set";
    EventKind["JudgementGiven"] = "identity-judgement-given";
    EventKind["IdentityCleared"] = "identity-cleared";
    EventKind["IdentityKilled"] = "identity-killed";
    EventKind["NewSession"] = "new-session";
    EventKind["AllGood"] = "all-good";
    EventKind["HeartbeatReceived"] = "heartbeat-received";
    EventKind["SomeOffline"] = "some-offline";
    // offences events
    EventKind["Offence"] = "offences-offence";
})(EventKind = exports.EventKind || (exports.EventKind = {}));
// eslint-disable-next-line semi-style
exports.EventKinds = Object.values(EventKind);
//# sourceMappingURL=types.js.map