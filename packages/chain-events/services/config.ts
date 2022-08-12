require('dotenv').config();

export const DATABASE_URI =
  !process.env.DATABASE_URL || process.env.NODE_ENV === 'development'
    ? 'postgresql://commonwealth:edgeware@localhost/commonwealth_chain_events'
    : process.env.DATABASE_URL;

export const JWT_SECRET = process.env.JWT_SECRET || 'jwt secret';

export const RABBITMQ_URI = (() => {
  if (!process.env.CLOUDAMQP_URL || process.env.NODE_ENV === 'development') {
    if (process.env.VULTR_RABBITMQ_CONTAINER_PORT && process.env.VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT) {
      return `amqp://guest:guest@${process.env.VULTR_IP}:${process.env.VULTR_RABBITMQ_CONTAINER_PORT}`
    } else return 'amqp://guest:guest@localhost:5672'
  } else return process.env.CLOUDAMQP_URL
})()

export const ROLLBAR_SERVER_TOKEN = process.env.ROLLBAR_SERVER_TOKEN;

// ----------------- ChainSubscriber specific var ------------------------
export const WORKER_NUMBER = process.env.WORKER_NUMBER ? Number(process.env.WORKER_NUMBER) : 0;
export const NUM_WORKERS = process.env.NUM_WORKERS ? Number(process.env.NUM_WORKERS) : 1;

// The number of minutes to wait between each run -- rounded to the nearest whole number
export const REPEAT_TIME = Math.round(Number(process.env.REPEAT_TIME)) || 1;
