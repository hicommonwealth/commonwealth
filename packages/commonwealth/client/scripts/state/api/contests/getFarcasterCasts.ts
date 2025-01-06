import { SortType } from 'views/pages/ContestPage/ContestPage';
import { trpc } from '../../../utils/trpcClient';

interface FetchFarcasterCastsProps {
  contest_address: string;
  selectedSort: SortType;
}

const useFetchFarcasterCastsQuery = ({
  contest_address,
  selectedSort,
}: FetchFarcasterCastsProps) => {
  return trpc.contest.getFarcasterCasts.useQuery({
    contest_address,
    sort_by: selectedSort,
  });
};

export default useFetchFarcasterCastsQuery;
