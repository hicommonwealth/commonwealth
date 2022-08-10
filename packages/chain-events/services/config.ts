require('dotenv').config();

export const DATABASE_URI =
  !process.env.DATABASE_URL || process.env.NODE_ENV === 'development'
    ? 'postgresql://commonwealth:edgeware@localhost/commonwealth'
    : process.env.DATABASE_URL;

export const JWT_SECRET = process.env.JWT_SECRET || 'jwt secret';

export const RABBITMQ_URI = (() => {
  if (!process.env.CLOUDAMQP_URL || process.env.NODE_ENV === 'development') {
    if (process.env.VULTR_RABBITMQ_CONTAINER_PORT && process.env.VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT) {
      return `amqp://guest:guest@${process.env.VULTR_IP}:${process.env.VULTR_RABBITMQ_CONTAINER_PORT}`
    } else return 'amqp://guest:guest@localhost:5672'
  } else return process.env.CLOUDAMQP_URL
})()
