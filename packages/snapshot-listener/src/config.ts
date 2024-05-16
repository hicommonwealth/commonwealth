import { configure, config as target } from '@hicommonwealth/core';
import { z } from 'zod';

export const config = configure(target, {}, z.object({}));

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const RABBITMQ_URI = (() => {
  if (!process.env.CLOUDAMQP_URL || process.env.NODE_ENV === 'development') {
    return 'amqp://127.0.0.1';
  } else return process.env.CLOUDAMQP_URL;
})();

export const DEFAULT_PORT = '8001';
