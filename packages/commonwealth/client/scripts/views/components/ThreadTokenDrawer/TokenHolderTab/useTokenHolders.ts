import { useMemo } from 'react';
import { useGetThreadTokenHoldersQuery } from '../../../../state/api/tokens/getThreadTokenHolders';

export type TokenHolder = {
  user_id: number;
  name: string | null;
  avatar_url: string | null;
  address: string;
  trade_count: number;
  balance: number;
  percentage: number;
};

export const useTokenHolders = (threadId: number) => {
  const { data: holdersData, isLoading: isLoadingHolders } =
    useGetThreadTokenHoldersQuery(
      { thread_id: threadId },
      { enabled: !!threadId },
    );

  const tokenHolders = useMemo(() => {
    if (!holdersData) return [];

    return holdersData
      .map((holder) => ({
        user_id: parseInt(holder.user_id || '0'),
        name: holder.holder_name,
        avatar_url: holder.avatar_url || '',
        address: '',
        trade_count: 0,
        balance: parseFloat(holder.net_tokens),
        percentage: parseFloat(holder.percent_share),
      }))
      .sort((a, b) => b.balance - a.balance);
  }, [holdersData]);

  return {
    tokenHolders,
    isLoading: isLoadingHolders,
  };
};
