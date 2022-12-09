"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHAIN_EVENT_SERVICE_SECRET = exports.CW_SERVER_URL = exports.REPEAT_TIME = exports.NUM_CHAIN_SUBSCRIBERS = exports.CHAIN_SUBSCRIBER_INDEX = exports.ROLLBAR_SERVER_TOKEN = exports.RABBITMQ_API_URI = exports.RABBITMQ_URI = exports.JWT_SECRET = exports.CW_DATABASE_URI = exports.DATABASE_URI = exports.DEFAULT_PORT = void 0;
require('dotenv').config();
exports.DEFAULT_PORT = '8081';
exports.DATABASE_URI = !process.env.DATABASE_URL || process.env.NODE_ENV === 'development'
    ? 'postgresql://commonwealth:edgeware@localhost/commonwealth_chain_events'
    : process.env.DATABASE_URL;
exports.CW_DATABASE_URI = !process.env.CW_DATABASE_URL || process.env.NODE_ENV === 'development'
    ? 'postgresql://commonwealth:edgeware@localhost/commonwealth'
    : process.env.CW_DATABASE_URL;
exports.JWT_SECRET = process.env.JWT_SECRET || 'jwt secret';
exports.RABBITMQ_URI = (() => {
    if (!process.env.CLOUDAMQP_URL || process.env.NODE_ENV === 'development') {
        if (process.env.VULTR_RABBITMQ_CONTAINER_PORT &&
            process.env.VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT) {
            return `amqp://guest:guest@${process.env.VULTR_IP}:${process.env.VULTR_RABBITMQ_CONTAINER_PORT}`;
        }
        else
            return 'amqp://guest:guest@localhost:5672';
    }
    else
        return process.env.CLOUDAMQP_URL;
})();
exports.RABBITMQ_API_URI = (() => {
    if (process.env.VULTR_RABBITMQ_CONTAINER_PORT &&
        process.env.VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT)
        return `http://guest:guest@${process.env.VULTR_IP}:${process.env.VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT}/api`;
    else
        return 'http://guest:guest@localhost:15672/api';
})();
exports.ROLLBAR_SERVER_TOKEN = process.env.ROLLBAR_SERVER_TOKEN;
// ----------------- ChainSubscriber specific var ------------------------
exports.CHAIN_SUBSCRIBER_INDEX = process.env.CHAIN_SUBSCRIBER_INDEX
    ? Number(process.env.CHAIN_SUBSCRIBER_INDEX)
    : 0;
exports.NUM_CHAIN_SUBSCRIBERS = process.env.NUM_CHAIN_SUBSCRIBERS
    ? Number(process.env.NUM_CHAIN_SUBSCRIBERS)
    : 1;
// The number of minutes to wait between each run -- rounded to the nearest whole number
exports.REPEAT_TIME = Math.round(Number(process.env.REPEAT_TIME)) || 1;
exports.CW_SERVER_URL = process.env.SERVER_URL || 'http://localhost:8080';
// used to query CE only routes on CW
exports.CHAIN_EVENT_SERVICE_SECRET = process.env.CHAIN_EVENT_SERVICE_SECRET || 'secret';
