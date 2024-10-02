import { useInfiniteQuery } from '@tanstack/react-query';
import { SortType } from 'views/pages/ContestPage/ContestPage';

const FARCASTER_CASTS_STALE_TIME = 30 * 1_000; // 30 s

interface FetchFarcasterCastsProps {
  contestAddress: string;
  selectedSort: SortType;
  pageParam?: number;
}

const mock = [
  'https://warpcast.com/kugusha.eth/0x64be20bf',
  'https://warpcast.com/antimofm.eth/0xd082a36c',
  'https://warpcast.com/linda/0xa72c0daa',
  'https://warpcast.com/jacob/0x8653763f',
];

// list of 40 mock data, with generated likes and index
const entries = Array.from({ length: 40 }, () => ({
  url: mock[Math.floor(Math.random() * mock.length)],
  like: Math.floor(Math.random() * 100),
})).map((el, i) => ({ ...el, id: i }));

type ResType = {
  data: { url: string; id: number; like: number }[];
  currentPage: number;
  nextPage: number | null;
  previousPage: number | null;
  totalPages: number;
};

const fakeApi = ({
  pageParam,
  selectedSort,
}: FetchFarcasterCastsProps): Promise<ResType> => {
  const pageSize = 5;
  const totalItems = entries.length;

  const sortedEntries = entries.sort((a, b) => {
    return selectedSort === SortType.DESC ? b.like - a.like : a.like - b.like;
  });

  const currentPage = pageParam || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentPageItems = sortedEntries.slice(startIndex, endIndex);
  const nextPage = endIndex < totalItems ? currentPage + 1 : null;
  const previousPage = currentPage > 1 ? currentPage - 1 : null;
  const totalPages = Math.ceil(totalItems / pageSize);

  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          data: currentPageItems,
          currentPage,
          nextPage,
          previousPage,
          totalPages,
        }),
      1000,
    ),
  );
};

const fetchFarcasterCasts = async ({
  pageParam = 0,
  selectedSort,
  contestAddress,
}: FetchFarcasterCastsProps): Promise<ResType> => {
  return await fakeApi({ pageParam, selectedSort, contestAddress });
};

const useFetchFarcasterCastsQuery = ({
  contestAddress,
  selectedSort,
}: FetchFarcasterCastsProps) => {
  return useInfiniteQuery({
    queryKey: ['farcasterCasts', contestAddress, selectedSort],
    queryFn: ({ pageParam = 1 }) =>
      fetchFarcasterCasts({ pageParam, selectedSort, contestAddress }),
    getNextPageParam: (lastPage) => {
      const nextPageNum = lastPage.currentPage + 1;
      if (nextPageNum <= lastPage.totalPages) {
        return nextPageNum;
      }
      return undefined;
    },
    staleTime: FARCASTER_CASTS_STALE_TIME,
  });
};

export default useFetchFarcasterCastsQuery;
