import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'server/models/thread';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const THREAD_STALE_TIME = 30 * 1_000; // 30 s

interface GetThreadsByLinkProps {
  chainId: string;
  link: Link;
  enabled: boolean;
}

const getThreadsByLink = async ({ link }: GetThreadsByLinkProps) => {
  const response = await axios.post(`${app.serverUrl()}/linking/getLinks`, {
    link,
    jwt: app.user.jwt,
  });

  return response.data.result.threads//.map((t) => app.threads.modelFromServer(t));
};

// Gets all threads associated with a link(ie all threads linked to 1 proposal)
const useGetThreadsByLinkQuery = ({ chainId, link, enabled }: GetThreadsByLinkProps) => {
  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [ApiEndpoints.FETCH_THREADS, chainId, 'byLink', link.source, link.identifier],
    queryFn: () => getThreadsByLink({ chainId, link, enabled }),
    staleTime: THREAD_STALE_TIME,
    enabled: enabled,
  });
};

export default useGetThreadsByLinkQuery;
