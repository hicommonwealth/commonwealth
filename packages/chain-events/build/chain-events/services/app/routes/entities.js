"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Errors = void 0;
const errors_1 = require("../../../../common-common/src/errors");
exports.Errors = {
    NeedChain: 'Must provide a chain to fetch entities from',
};
const entities = async (models, req, res, next) => {
    if (!req.query.chain) {
        return next(new errors_1.AppError(exports.Errors.NeedChain));
    }
    const entityFindOptions = {
        include: [
            {
                model: models.ChainEvent,
                order: [[models.ChainEvent, 'id', 'asc']],
                include: [models.ChainEventType],
            },
        ],
        order: [['created_at', 'DESC']],
        where: {
            chain: req.query.chain,
        },
    };
    if (req.query.id) {
        entityFindOptions.where.id = req.query.id;
    }
    if (req.query.type) {
        entityFindOptions.where.type = req.query.type;
    }
    if (req.query.type_id) {
        entityFindOptions.where.type_id = req.query.type_id;
    }
    if (req.query.completed) {
        entityFindOptions.where.completed = true;
    }
    const entities = await models.ChainEntity.findAll(entityFindOptions);
    return res.json({
        status: 'Success',
        result: entities.map((e) => e.toJSON()),
    });
};
exports.default = entities;
