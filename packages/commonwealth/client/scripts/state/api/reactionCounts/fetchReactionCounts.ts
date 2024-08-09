import axios from 'axios';
import { SERVER_URL } from 'state/api/config';

interface FetchReactionCountsProps {
  // chainId: string; // this should be used when we fully migrate thread controller to react query
  address: string;
  threadIds?: number[];
  proposalIds?: string[];
  commentIds?: string[];
}

const fetchReactionCounts = async ({
  address,
  threadIds,
  proposalIds,
  commentIds,
}: FetchReactionCountsProps) => {
  const response = await axios.post(`${SERVER_URL}/reactionsCounts`, {
    // @ts-expect-error StrictNullChecks
    ...(threadIds?.length > 0 && { thread_ids: threadIds }),
    // @ts-expect-error StrictNullChecks
    ...(proposalIds?.length > 0 && { proposal_ids: proposalIds }),
    // @ts-expect-error StrictNullChecks
    ...(commentIds?.length > 0 && { comment_ids: commentIds }),
    active_address: address,
  });

  return [...response.data.result];
};

export default fetchReactionCounts;
