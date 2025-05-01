import { trpc } from 'utils/trpcClient';

const FETCH_TOKENS_STALE_TIME = 60 * 3_000; // 3 mins

type UseGetTokenInfoAlchemy = {
  eth_chain_id?: number;
  token_address: string;
  enabled: boolean;
};

const useGetTokenInfoAlchemy = ({
  eth_chain_id,
  token_address,
  enabled = true,
}: UseGetTokenInfoAlchemy) => {
  return trpc.launchpadToken.getTokenInfoAlchemy.useQuery(
    {
      eth_chain_id: eth_chain_id!,
      token_address,
    },
    {
      cacheTime: FETCH_TOKENS_STALE_TIME,
      enabled,
    },
  );
};

export default useGetTokenInfoAlchemy;
