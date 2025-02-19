import { SortType } from 'views/pages/ContestPage/types';
import { trpc } from '../../../utils/trpcClient';

interface FetchFarcasterCastsProps {
  contest_address: string;
  selectedSort: SortType;
  isEnabled?: boolean;
}

const useFetchFarcasterCastsQuery = ({
  contest_address,
  selectedSort,
  isEnabled = true,
}: FetchFarcasterCastsProps) => {
  return trpc.contest.getFarcasterCasts.useQuery(
    {
      contest_address,
      sort_by: selectedSort,
    },
    {
      enabled: isEnabled,
    },
  );
};

export default useFetchFarcasterCastsQuery;
