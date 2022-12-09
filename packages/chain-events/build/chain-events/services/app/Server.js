"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const logging_1 = require("../../../common-common/src/logging");
const body_parser_1 = __importDefault(require("body-parser"));
const passport_1 = __importDefault(require("passport"));
const passport_2 = __importDefault(require("./passport"));
const router_1 = __importDefault(require("./router"));
const database_1 = __importDefault(require("../database/database"));
const config_1 = require("../config");
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const log = logging_1.factory.getLogger((0, logging_1.formatFilename)(__filename));
const port = process.env.PORT || config_1.DEFAULT_PORT;
exports.app = (0, express_1.default)();
(0, passport_2.default)();
/**
 * Entry point for the ChainEvents App
 */
async function main() {
    exports.app.use((0, morgan_1.default)('dev'));
    exports.app.use(body_parser_1.default.urlencoded({ extended: false }));
    exports.app.use(body_parser_1.default.json({ limit: '1mb' }));
    exports.app.use(passport_1.default.initialize());
    exports.app.use((0, cors_1.default)());
    // cors pre-flight request
    exports.app.options('*', (0, cors_1.default)());
    const router = (0, router_1.default)(database_1.default);
    exports.app.use('/api', router);
    exports.app.set('port', port);
    const onError = (error) => {
        if (error.syscall !== 'listen') {
            throw error;
        }
        switch (error.code) {
            case 'EACCES':
                log.error('Port requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                log.error(`Port ${port} is already in use`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    };
    exports.app.on('error', onError);
    exports.app.listen(port, () => {
        log.info(`Chain events server listening on port ${port}`);
    });
}
main();
