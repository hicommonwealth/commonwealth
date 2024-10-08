import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Tag from 'models/Tag';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';

const TAGS_STALE_TIME = 60 * 1_000; // 60 s

const fetchTags = async (): Promise<Tag[]> => {
  const response = await axios.get(`${SERVER_URL}${ApiEndpoints.FETCH_TAGS}`);

  return response.data.result.map((t) => new Tag(t));
};

const useFetchTagsQuery = () => {
  return useQuery({
    queryKey: [ApiEndpoints.FETCH_TAGS],
    queryFn: () => fetchTags(),
    staleTime: TAGS_STALE_TIME,
  });
};

export default useFetchTagsQuery;
