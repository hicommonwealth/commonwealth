import { trpc } from 'utils/trpcClient';

interface GetMutualConnectionsInput {
  user_id_1: number;
  user_id_2: number;
  limit?: number;
}

export const useMutualConnections = (
  input: GetMutualConnectionsInput,
  options?: { enabled?: boolean },
) => {
  return trpc.user.getMutualConnections.useQuery(input, options);
};
