import { trpc } from 'utils/trpcClient';

export function Test() {
  // FIXME the problem is that useQuery uses AnyProcedure which drops types on the frontend
  trpc.subscription.getCommentSubscriptions.useQuery({});
}
