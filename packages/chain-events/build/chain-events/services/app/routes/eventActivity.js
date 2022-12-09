"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Errors = void 0;
const errors_1 = require("../../../../common-common/src/errors");
const sequelize_1 = require("sequelize");
exports.Errors = {
    NeedLimit: 'Must provide limit to fetch events',
};
const eventActivity = async (models, req, res, next) => {
    if (!req.query.limit) {
        return next(new errors_1.AppError(exports.Errors.NeedLimit));
    }
    const events = await models.sequelize.query(`
      SELECT ce.id,
             ce.chain_event_type_id,
             ce.block_number,
             ce.event_data,
             ce.created_at,
             ce.updated_at,
             ce.entity_id,
             cet.chain,
             cet.event_network
      FROM "ChainEvents" ce
               JOIN "ChainEventTypes" cet ON ce.chain_event_type_id = cet.id
      ORDER BY ce.created_at DESC
      LIMIT ?;
  `, { replacements: [req.query.limit], raw: true, type: sequelize_1.QueryTypes.SELECT });
    return res.json({ status: 'Success', result: events });
};
exports.default = eventActivity;
