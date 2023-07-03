import * as dotenv from 'dotenv';
dotenv.config();

export const RABBITMQ_URI = (() => {
  if (!process.env.CLOUDAMQP_URL || process.env.NODE_ENV === 'development') {
    if (
      process.env.VULTR_RABBITMQ_CONTAINER_PORT &&
      process.env.VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT
    ) {
      return `amqp://guest:guest@${process.env.VULTR_IP}:${process.env.VULTR_RABBITMQ_CONTAINER_PORT}`;
    } else return 'amqp://localhost';
  } else return process.env.CLOUDAMQP_URL;
})();

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

export const SERVER_URL = process.env.SERVER_URL;

export const CW_BOT_KEY = process.env.CW_BOT_KEY;