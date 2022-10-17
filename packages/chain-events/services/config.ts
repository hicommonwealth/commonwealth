require('dotenv').config();

export const DEFAULT_PORT = '8081';

export const DATABASE_URI =
  !process.env.DATABASE_URL || process.env.NODE_ENV === 'development'
    ? 'postgresql://commonwealth:edgeware@localhost/commonwealth_chain_events'
    : process.env.DATABASE_URL;

export const TEMP_DATABASE_URI = (() => {
  // this supersedes all other urls - returned when the app is deployed on another service such as commonwealth-staging
  if (process.env.CE_DATABASE_URL) return process.env.CE_DATABASE_URL;

  if (!process.env.DATABASE_URL || process.env.NODE_ENV === 'development')
    // this is returned locally
    return 'postgresql://commonwealth:edgeware@localhost/commonwealth_chain_events'
  // this is returned when the app is deployed on chain-events app
  else return process.env.DATABASE_URL
})()

export const CW_DATABASE_URI = !process.env.CW_DATABASE_URL || process.env.NODE_ENV === 'development'
  ? 'postgresql://commonwealth:edgeware@localhost/commonwealth'
  : process.env.CW_DATABASE_URL;

export const JWT_SECRET = process.env.JWT_SECRET || 'jwt secret';

export const RABBITMQ_URI = (() => {
  if (!process.env.CLOUDAMQP_URL || process.env.NODE_ENV === 'development') {
    if (process.env.VULTR_RABBITMQ_CONTAINER_PORT && process.env.VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT) {
      return `amqp://guest:guest@${process.env.VULTR_IP}:${process.env.VULTR_RABBITMQ_CONTAINER_PORT}`
    } else return 'amqp://guest:guest@localhost:5672'
  } else return process.env.CLOUDAMQP_URL
})();

export const RABBITMQ_API_URI = (() => {
  if (process.env.VULTR_RABBITMQ_CONTAINER_PORT && process.env.VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT)
    return `http://guest:guest@${process.env.VULTR_IP}:${process.env.VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT}/api`
  else return 'http://guest:guest@localhost:15672/api'
})();

export const ROLLBAR_SERVER_TOKEN = process.env.ROLLBAR_SERVER_TOKEN;

// ----------------- ChainSubscriber specific var ------------------------
export const WORKER_NUMBER = process.env.WORKER_NUMBER ? Number(process.env.WORKER_NUMBER) : 0;
export const NUM_WORKERS = process.env.NUM_WORKERS ? Number(process.env.NUM_WORKERS) : 1;

// The number of minutes to wait between each run -- rounded to the nearest whole number
export const REPEAT_TIME = Math.round(Number(process.env.REPEAT_TIME)) || 1;

export const SERVER_URL = process.env.SERVER_URL || "http://localhost:8080"
