import { trpc } from 'utils/trpcClient';
export function useUnSubscribeEmailMutation() {
  return trpc.subscriptions.unSubscribeEmail.useMutation();
}
