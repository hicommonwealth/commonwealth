"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const entities_1 = __importDefault(require("./routes/entities"));
const eventActivity_1 = __importDefault(require("./routes/eventActivity"));
const migrateEvent_1 = __importDefault(require("./routes/migrateEvent"));
/**
 * Function that creates an Express Router for the ChainEvents app. This function defines all of our apps routes.
 * @param models {DB}
 */
function setupRouter(models) {
    const router = (0, express_1.Router)();
    router.get('/entities', entities_1.default.bind(this, models));
    router.get('/events', eventActivity_1.default.bind(this, models));
    router.post('/migrateEvent', migrateEvent_1.default.bind(this, models));
    router.get('/test', passport_1.default.authenticate('jwt', { session: false }), (req, res) => {
        return res.status(200).json({ success: true });
    });
    return router;
}
exports.default = setupRouter;
