import { trpc } from '@hicommonwealth/adapters';
import cors from 'cors';
import { Router } from 'express';
import { config } from '../config';
import { trpcRouter } from './internal-router';

const PATH = '/api/internal-oas';
const router = Router();

if (config.NODE_ENV !== 'production') {
  router.use(cors());
  trpc.useOAS(router, trpcRouter, {
    title: 'Internal API',
    path: PATH,
    version: '0.0.1',
  });
}

export { PATH, router };
