"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logging_1 = require("../../../../common-common/src/logging");
const errors_1 = require("../../../../common-common/src/errors");
const migrateChainEntities_1 = require("../../../scripts/migrateChainEntities");
const log = logging_1.factory.getLogger((0, logging_1.formatFilename)(__filename));
var MigrateEventErrors;
(function (MigrateEventErrors) {
    MigrateEventErrors["Failed"] = "Request Failed.";
    MigrateEventErrors["AllError"] = "Failed to migrate all events.";
    MigrateEventErrors["MissingChainID"] = "Missing chain_id.";
    MigrateEventErrors["ChainError"] = "Failed to migrate chain events.";
})(MigrateEventErrors || (MigrateEventErrors = {}));
const migrateEvent = async (models, req, res, next) => {
    const { secret, migrateAll, chain_id } = req.body;
    if (!process.env.AIRPLANE_SECRET ||
        !secret ||
        process.env.AIRPLANE_SECRET !== secret) {
        return next(new errors_1.AppError(MigrateEventErrors.Failed));
    }
    if (migrateAll && migrateAll === true) {
        try {
            (0, migrateChainEntities_1.runEntityMigrations)();
        }
        catch (e) {
            return next(new errors_1.AppError(MigrateEventErrors.AllError));
        }
        return res.json({ status: 'Success', result: { message: 'Started migration for all events.' } });
    }
    if (!chain_id) {
        return next(new errors_1.AppError(MigrateEventErrors.MissingChainID));
    }
    try {
        (0, migrateChainEntities_1.runEntityMigrations)(chain_id);
    }
    catch (e) {
        log.error(e.message);
        return next(new errors_1.AppError(MigrateEventErrors.ChainError));
    }
    return res.json({ status: 'Success', result: { message: `Started migration for ${chain_id}.` } });
};
exports.default = migrateEvent;
