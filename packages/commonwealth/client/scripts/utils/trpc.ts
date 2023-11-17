import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../server/trpc/rootRouter';

export const trpc = createTRPCReact<AppRouter>();
