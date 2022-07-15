"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventKinds = exports.EventKind = exports.EntityKind = exports.ContractType = void 0;
var ContractType;
(function (ContractType) {
    ContractType[ContractType["Factory"] = 0] = "Factory";
    ContractType[ContractType["Project"] = 1] = "Project";
    ContractType[ContractType["cToken"] = 2] = "cToken";
    ContractType[ContractType["bToken"] = 3] = "bToken";
})(ContractType = exports.ContractType || (exports.ContractType = {}));
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
//# sourceMappingURL=types.js.map