import * as schemas from '@hicommonwealth/schemas'; // Assuming schemas location
import { trpc } from 'utils/trpcClient'; // Assuming trpcClient location
import { z } from 'zod';

// Define the hook using the assumed TRPC procedure path 'token.getLaunchpadTrades'
// IMPORTANT: Verify and update 'trpc.token.getLaunchpadTrades' if your actual procedure path is different.
export const useGetLaunchpadTradesQuery = (
  // Input type from the Zod schema
  input: z.infer<typeof schemas.GetLaunchpadTrades.input>,
  // Options like `enabled`, `staleTime`, etc., passed to react-query
  options?: Parameters<
    typeof trpc.launchpadToken.getLaunchpadTrades.useQuery
  >[1],
) => {
  // Call the TRPC hook
  return trpc.launchpadToken.getLaunchpadTrades.useQuery(input, options);
};

// Export the inferred input/output types for convenience elsewhere
export type GetLaunchpadTradesInput =
  typeof schemas.GetLaunchpadTrades.input.type;
// Note: The output type was already defined and imported from 'types/api' in other files.
// We might need to reconcile this later if 'types/api' is not the canonical source.
