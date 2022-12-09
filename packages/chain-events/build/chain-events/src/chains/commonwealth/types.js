"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventKinds = exports.EventKind = exports.EntityKind = exports.CommonContractType = void 0;
var CommonContractType;
(function (CommonContractType) {
    CommonContractType[CommonContractType["Factory"] = 0] = "Factory";
    CommonContractType[CommonContractType["Project"] = 1] = "Project";
    CommonContractType[CommonContractType["cToken"] = 2] = "cToken";
    CommonContractType[CommonContractType["bToken"] = 3] = "bToken";
})(CommonContractType = exports.CommonContractType || (exports.CommonContractType = {}));
// eslint-disable-next-line no-shadow
var EntityKind;
(function (EntityKind) {
    // eslint-disable-next-line no-shadow
    EntityKind["Project"] = "project";
})(EntityKind = exports.EntityKind || (exports.EntityKind = {}));
var EventKind;
(function (EventKind) {
    EventKind["ProjectCreated"] = "project-created";
    EventKind["ProjectBacked"] = "project-backed";
    EventKind["ProjectCurated"] = "project-curated";
    EventKind["ProjectSucceeded"] = "project-succeeded";
    EventKind["ProjectFailed"] = "project-failed";
    EventKind["ProjectWithdraw"] = "project-withdraw";
})(EventKind = exports.EventKind || (exports.EventKind = {}));
exports.EventKinds = Object.values(EventKind);
