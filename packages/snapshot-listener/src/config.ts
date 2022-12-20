/* eslint-disable indent,prefer-template,operator-linebreak */
require('dotenv').config();

export const RABBITMQ_URI = (() => {
  if (!process.env.CLOUDAMQP_URL || process.env.NODE_ENV === "development") {
    if (
      process.env.VULTR_RABBITMQ_CONTAINER_PORT &&
      process.env.VULTR_RABBITMQ_MANAGEMENT_CONTAINER_PORT
    ) {
      return `amqp://guest:guest@${process.env.VULTR_IP}:${process.env.VULTR_RABBITMQ_CONTAINER_PORT}`;
    } else return "amqp://localhost";
  } else return process.env.CLOUDAMQP_URL;
})();

export const DEFAULT_PORT = '8001';
