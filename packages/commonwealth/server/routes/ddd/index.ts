import { trpc } from '@hicommonwealth/adapters';
import community from './community';

export const router = trpc.router({ community });
// TODO: add stats middleware

export const api = trpc.toExpress(router);
export const panel = (url) => trpc.toPanel(router, url);
