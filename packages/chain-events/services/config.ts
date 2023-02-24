import * as dotenv from 'dotenv';
dotenv.config();

export const DEFAULT_PORT = '8081';

export const DATABASE_URI =
  !process.env.DATABASE_URL || process.env.NODE_ENV === 'development'
    ? 'postgresql://commonwealth:edgeware@localhost/commonwealth_chain_events'
    : process.env.DATABASE_URL;

export const CW_DATABASE_URI =
  !process.env.CW_DATABASE_URL || process.env.NODE_ENV === 'development'
    ? 'postgresql://commonwealth:edgeware@localhost/commonwealth'
    : process.env.CW_DATABASE_URL;

export const JWT_SECRET = process.env.JWT_SECRET || 'jwt secret';

export const RABBITMQ_URI = (() => {
  if (!process.env.CLOUDAMQP_URL || process.env.NODE_ENV === 'development') {
    if (
      process.env.VULTR_RABBITMQ_CONTAINER_PORT &&
      process.env.VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT
    ) {
      return `amqp://guest:guest@${process.env.VULTR_IP}:${process.env.VULTR_RABBITMQ_CONTAINER_PORT}`;
    } else return 'amqp://guest:guest@127.0.0.1:5672';
  } else return process.env.CLOUDAMQP_URL;
})();

export const RABBITMQ_API_URI = (() => {
  if (
    process.env.VULTR_RABBITMQ_CONTAINER_PORT &&
    process.env.VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT
  )
    return `http://guest:guest@${process.env.VULTR_IP}:${process.env.VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT}/api`;
  else return 'http://guest:guest@localhost:15672/api';
})();

export const ROLLBAR_SERVER_TOKEN = process.env.ROLLBAR_SERVER_TOKEN;

// ----------------- ChainSubscriber specific var ------------------------
export const CHAIN_SUBSCRIBER_INDEX = process.env.CHAIN_SUBSCRIBER_INDEX
  ? Number(process.env.CHAIN_SUBSCRIBER_INDEX)
  : 0;
export const NUM_CHAIN_SUBSCRIBERS = process.env.NUM_CHAIN_SUBSCRIBERS
  ? Number(process.env.NUM_CHAIN_SUBSCRIBERS)
  : 1;

// The number of minutes to wait between each run -- rounded to the nearest whole number
export const REPEAT_TIME = Math.round(Number(process.env.REPEAT_TIME)) || 1;

export const CW_SERVER_URL = process.env.SERVER_URL || 'http://localhost:8080';

// used to query CE only routes on CW
export const CHAIN_EVENT_SERVICE_SECRET =
  process.env.CHAIN_EVENT_SERVICE_SECRET || 'secret';
