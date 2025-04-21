import * as schemas from '@hicommonwealth/schemas'; // Assuming schemas location
import { trpc } from 'utils/trpcClient'; // Assuming trpcClient location

// Define the hook using the assumed TRPC procedure path 'token.getLaunchpadTrades'
// IMPORTANT: Verify and update 'trpc.token.getLaunchpadTrades' if your actual procedure path is different.
export const useGetLaunchpadTradesQuery = (
  // Input type from the Zod schema
  input: typeof schemas.GetLaunchpadTrades.input._type,
  // Options like `enabled`, `staleTime`, etc., passed to react-query
  options?: Parameters<typeof trpc.token.getLaunchpadTrades.useQuery>[1],
) => {
  // Call the TRPC hook
  return trpc.token.getLaunchpadTrades.useQuery(input, options);
};

// Export the inferred input/output types for convenience elsewhere
export type GetLaunchpadTradesInput =
  typeof schemas.GetLaunchpadTrades.input._type;
// Note: The output type was already defined and imported from 'types/api' in other files.
// We might need to reconcile this later if 'types/api' is not the canonical source.
// export type GetLaunchpadTradesOutput = typeof schemas.GetLaunchpadTrades.output._type;
