"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_jwt_1 = __importDefault(require("passport-jwt"));
const config_1 = require("../config");
const JWTStrategy = passport_jwt_1.default.Strategy;
const ExtractJWT = passport_jwt_1.default.ExtractJwt;
function useDefaultUserAuth() {
    passport_1.default.use(new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromExtractors([
            ExtractJWT.fromBodyField('jwt'),
            ExtractJWT.fromUrlQueryParameter('jwt'),
            ExtractJWT.fromAuthHeaderAsBearerToken(),
        ]),
        secretOrKey: config_1.JWT_SECRET,
    }, async (jwtPayload, done) => {
        // jwtPayload: { id: 12345, email: null, iat: 1234567891 }
        done(null, jwtPayload);
    }));
}
function setupPassport() {
    useDefaultUserAuth();
}
exports.default = setupPassport;
