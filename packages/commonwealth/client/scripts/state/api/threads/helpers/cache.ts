import Thread from 'models/Thread';
import Topic from 'models/Topic';
import { ApiEndpoints, queryClient } from 'state/api/config';

/**
 * What is this file?
 * --
 * This is a utility file to abstract away complex thread cache updates for react query into a unified and
 * simplified api (atleast simpler than if it was used in independent files).
 * --
 * --
 * How many thread cache's are we dealing with?
 * --
 * We have 3 thread caches.
 *
 * 1- for /threads?bulk=true -> we have this array key
 * [
 *   ApiEndpoints.FETCH_THREADS,
 *   props.communityId,
 *   props.queryType,
 *   props.topicId,
 *   props.stage,
 *   props.includePinnedThreads,
 *   props.toDate,
 *   props.fromDate,
 *   props.limit,
 *   props.orderBy,
 * ]
 * and in this key, other than the first and third parameters, all other parameters can change, each of these changing
 * parameter will create a new cache -> this cache and api response is used in the thread listing page i.e /discussions
 *
 * 2- for /threads?active=true -> we have this array key
 *  [
 *    ApiEndpoints.FETCH_THREADS,
 *    props.communityId,
 *    props.queryType,
 *    props.topicsPerThread,
 *  ]
 * and only the second and 4th parameter will ever change.  -> this cache and api response is used in the community
 * overview page i.e /overview
 *
 * 3- for /threads?thread_ids=[] -> we have this array key
 * [
 *   ApiEndpoints.FETCH_THREADS,
 *   communityId,
 *   'single',
 *   ...ids,
 * ]
 * the second parameter can change, and after the 3th param, there can be either 1 or many thread ids, each combination
 * will create a new cache  -> this cache and api response is used in the thread details page i.e /discussion/:threadId
 * --
 * --
 * How do cache updates work here?
 * --
 * Firstly we have to understand the response formats we are dealing with here.
 * 1- for 'single' and 'active' thread queries we have a simple array of thread objects ex: [{...thread1}, {...thread2}]
 * cache update in this case is simple
 *
 * 2- for 'bulk' thread queries we have a paginated response of thread which then gets formated by react query ex:
 * {  pages: [{data: [...threads], ...pagination-params} ... n], pageParams: [...pagination numbers] }
 * to update cache this we first have to find the page in which we have the specific thread, and then update that
 * since we can have many different caches, we would have to do it for each cache.
 * --
 * --
 * How are arrays updated?
 * ---
 * We use 'arrayManipulationMode' to update arrays in cache, we may want to
 * - add to an array -> arrayManipulationMode = combineAndRemoveDups
 * - remove from an array -> arrayManipulationMode = removeFromExisting
 * - replace an array -> arrayManipulationMode = replaceArray
 * --
 * --
 * What are update methods?
 * --
 * We are using 2 cache update methods
 * - 'update' -> will update the object in every cache
 * - 'remove' -> will remove the object from every cache
 */

type IExistingThreadState =
  | null
  | undefined
  | { pages: any[]; pageParams: any[] }[]
  | any;
type IArrayManipulationMode =
  | 'combineAndRemoveDups'
  | 'removeFromExisting'
  | 'replaceArray';

interface CacheUpdater {
  communityId: string;
  threadId: number;
  updateBody?: Partial<Thread>;
  method: 'update' | 'remove';
  arrayManipulationMode?: IArrayManipulationMode; // nested arrays are not updated
}

export const cacheTypes = {
  SINGLE_THREAD: 'single',
  BULK_THREADS: 'bulk',
  ACTIVE_THREADS: 'active',
};

const updateCacheForBulkThreads = ({
  existingData,
  threadId,
  arrayManipulationMode,
  arrayFieldsFromUpdateBody,
  updateBody,
}) => {
  const pages = [...(existingData.pages || [])];
  let foundThreadIndex = -1;
  const foundPageIndex = pages.findIndex((p) => {
    const index = p.data.threads.findIndex((t) => t.id === threadId);
    if (index > -1) foundThreadIndex = index;
    return index > -1 ? true : -1;
  });
  if (foundPageIndex > -1 && foundThreadIndex > -1) {
    if (
      arrayManipulationMode === 'combineAndRemoveDups' ||
      arrayManipulationMode === 'removeFromExisting' ||
      arrayFieldsFromUpdateBody.length > 0
    ) {
      pages[foundPageIndex].data.threads[foundThreadIndex] = {
        ...updateBody, // destructure order is important here
        ...pages[foundPageIndex].data.threads[foundThreadIndex],
      };
      arrayFieldsFromUpdateBody.map((field) => {
        if (pages[foundPageIndex].data.threads[foundThreadIndex][field]) {
          const updateBodyFieldIds = updateBody[field].map((x) => x?.id);
          pages[foundPageIndex].data.threads[foundThreadIndex][field] = [
            ...pages[foundPageIndex].data.threads[foundThreadIndex][field],
            // in filter we are assuming that each array field has a property 'id'
          ].filter((x) => !updateBodyFieldIds.includes(x?.id)); // this filter takes care of 'combineAndRemoveDups'

          if (arrayManipulationMode === 'combineAndRemoveDups') {
            pages[foundPageIndex].data.threads[foundThreadIndex][field] = [
              ...pages[foundPageIndex].data.threads[foundThreadIndex][field],
              ...updateBody[field],
            ];
          }
        }
      });
    }
    if (arrayManipulationMode === 'replaceArray') {
      pages[foundPageIndex].data.threads[foundThreadIndex] = {
        ...pages[foundPageIndex].data.threads[foundThreadIndex],
        ...updateBody, // destructure order is important here
      };
    }
  }

  return {
    ...existingData,
    pages,
  };
};

const removeCacheForBulkThreads = ({ existingData, threadId }) => {
  const pages = [...(existingData.pages || [])];
  let foundThreadIndex = -1;
  const foundPageIndex = pages.findIndex((p) => {
    const index = p.data.threads.findIndex((t) => t.id === threadId);
    if (index > -1) foundThreadIndex = index;
    return index > -1 ? true : -1;
  });

  if (foundPageIndex > -1 && foundThreadIndex > -1) {
    pages[foundPageIndex].data.threads = pages[
      foundPageIndex
    ].data.threads.filter((x) => x.id !== threadId);
  }

  return {
    ...existingData,
    pages,
  };
};

const updateCacheForSingleAndActiveThreads = ({
  threadId,
  updateBody,
  existingData,
  arrayManipulationMode,
  arrayFieldsFromUpdateBody,
}) => {
  const updatedThreads = [...existingData]; // threads array
  const foundThreadIndex = updatedThreads.findIndex((x) => x.id === threadId);
  if (foundThreadIndex > -1) {
    if (
      arrayManipulationMode === 'combineAndRemoveDups' ||
      arrayManipulationMode === 'removeFromExisting' ||
      arrayFieldsFromUpdateBody.length > 0
    ) {
      updatedThreads[foundThreadIndex] = {
        ...updateBody, // destructure order is important here
        ...updatedThreads[foundThreadIndex],
      };
      arrayFieldsFromUpdateBody.map((field) => {
        if (updatedThreads[foundThreadIndex][field]) {
          const updateBodyFieldIds = updateBody[field].map((x) => x?.id);
          updatedThreads[foundThreadIndex][field] = [
            ...updatedThreads[foundThreadIndex][field],
            // in filter we are assuming that each array field has a property 'id'
          ].filter((x) => !updateBodyFieldIds.includes(x?.id)); // this filter takes care of 'combineAndRemoveDups'

          if (arrayManipulationMode === 'combineAndRemoveDups') {
            updatedThreads[foundThreadIndex][field] = [
              ...updatedThreads[foundThreadIndex][field],
              ...updateBody[field],
            ];
          }
        }
      });
    }
    if (arrayManipulationMode === 'replaceArray') {
      updatedThreads[foundThreadIndex] = {
        ...updatedThreads[foundThreadIndex],
        ...updateBody, // destructure order is important here
      };
    }
  }
  return updatedThreads;
};

const cacheUpdater = ({
  communityId,
  threadId,
  updateBody,
  method,
  arrayManipulationMode = 'replaceArray',
}: CacheUpdater) => {
  const queryCache = queryClient.getQueryCache();
  const queryKeys = queryCache.getAll().map((cache) => cache.queryKey);

  // get all array fields from the update body
  const arrayFieldsFromUpdateBody = updateBody
    ? Object.keys(updateBody).filter((k) => Array.isArray(updateBody[k]))
    : [];

  // get all query keys for threads
  const keysForThreads = queryKeys.filter(
    (x) => x[0] === ApiEndpoints.FETCH_THREADS && x[1] === communityId,
  );

  keysForThreads.map((cacheKey: any[]) => {
    const [, , queryType] = cacheKey;

    // get existing data of this cache
    const existingData: IExistingThreadState =
      queryClient.getQueryData(cacheKey);

    if (existingData) {
      // we might want to run some callbacks after the cache update, store them here
      const remainingCallbacks = [];

      queryClient.setQueryData(cacheKey, () => {
        if (queryType === cacheTypes.BULK_THREADS) {
          if (method === 'update') {
            return updateCacheForBulkThreads({
              existingData,
              threadId,
              arrayFieldsFromUpdateBody,
              arrayManipulationMode,
              updateBody,
            });
          }

          if (method === 'remove') {
            return removeCacheForBulkThreads({
              existingData,
              threadId,
            });
          }
        }

        if (
          queryType === cacheTypes.SINGLE_THREAD ||
          queryType === cacheTypes.ACTIVE_THREADS
        ) {
          if (method === 'update') {
            return updateCacheForSingleAndActiveThreads({
              existingData,
              arrayManipulationMode,
              updateBody,
              arrayFieldsFromUpdateBody,
              threadId,
            });
          }
          if (method === 'remove') {
            remainingCallbacks.push(() => queryClient.refetchQueries(cacheKey));
            return [{}];
          }
        }
      });

      // run the remanining callbacks
      remainingCallbacks.map((x) => x());
    }
  });
};

const updateThreadInAllCaches = (
  communityId: string,
  threadId: number,
  updateBody: Partial<Thread>,
  arrayManipulationMode?: IArrayManipulationMode,
) => {
  cacheUpdater({
    communityId,
    threadId,
    method: 'update',
    updateBody,
    arrayManipulationMode: arrayManipulationMode || 'replaceArray',
  });
};

const removeThreadFromAllCaches = (communityId: string, threadId: number) => {
  cacheUpdater({ communityId, threadId, method: 'remove' });
};

const updateThreadTopicInAllCaches = (
  communityId: string,
  threadId: number,
  newTopic: Topic,
  oldTopicId: number,
) => {
  const queryCache = queryClient.getQueryCache();
  const queryKeys = queryCache.getAll().map((cache) => cache.queryKey);
  const keysForThreads = queryKeys.filter(
    (x) => x[0] === ApiEndpoints.FETCH_THREADS && x[1] === communityId,
  );

  keysForThreads.map((k) => {
    // 1- for single and active thread queries - just update the topic
    if (
      k[2] === cacheTypes.ACTIVE_THREADS ||
      (k[2] === cacheTypes.SINGLE_THREAD &&
        (k[3] === threadId ||
          ((k[3] as number[])?.length &&
            (k[3] as number[])?.includes(threadId))))
    ) {
      const existingData: IExistingThreadState = queryClient.getQueryData(k);
      const updatedThreads = [...existingData]; // threads array
      const foundThreadIndex = updatedThreads.findIndex(
        (x) => x.id === threadId,
      );
      if (foundThreadIndex > -1) {
        updatedThreads[foundThreadIndex] = {
          ...updatedThreads[foundThreadIndex],
          topic: newTopic,
        };
      }
      queryClient.setQueryData(k, () => updatedThreads);
    }

    // 2- for bulk queries - filter the existing thread that has old topic and refetch queries for the updates
    // topic id ideally we should not refetch - TODO: find a way to make this consistent
    if (k[2] === cacheTypes.BULK_THREADS) {
      // filter from old topic query
      if (k[3] === oldTopicId || k[3] === undefined) {
        const existingData: IExistingThreadState = queryClient.getQueryData(k);
        if (!existingData) return;
        const pages = [...(existingData.pages || [])];
        let foundThreadIndex = -1;
        const foundPageIndex = pages.findIndex((p) => {
          const index = p.data.threads.findIndex((t) => t.id === threadId);
          if (index > -1) foundThreadIndex = index;
          return index > -1 ? true : -1;
        });

        if (foundPageIndex > -1 && foundThreadIndex > -1) {
          pages[foundPageIndex].data.threads = pages[
            foundPageIndex
          ].data.threads.filter((x) => x.id !== threadId);
        }

        return {
          ...existingData,
          pages,
        };
      }
      // and refetch new topic queries
      if (k[3] === newTopic.id || k[3] === undefined) {
        queryClient.cancelQueries(k);
        queryClient.refetchQueries(k);
      }
    }
  });
};

const addThreadInAllCaches = (communityId: string, newThread: Thread) => {
  // refetch all caches for the thread topic and also the general cache
  const queryCache = queryClient.getQueryCache();
  const queryKeys = queryCache.getAll().map((cache) => cache.queryKey);
  const keysForThreads = queryKeys.filter(
    (x) => x[0] === ApiEndpoints.FETCH_THREADS && x[1] === communityId,
  );

  keysForThreads.map((k) => {
    // TODO: this is improper, we are essentially clearing cache when a thread is added. This is done to ensure
    // we have the correct thread ordering when refetching threads, but ideally we should find a way to correctly
    // position the thread in cache
    if (
      (k[2] === cacheTypes.BULK_THREADS &&
        (k[3] === newThread.topic.id || k[3] === undefined)) ||
      k[2] === cacheTypes.ACTIVE_THREADS
    ) {
      queryClient.cancelQueries(k);
      queryClient.refetchQueries(k);
    }
    // TODO: for now single cache will fetch the thread - not adding its state, ideally we should
    // add the thread here
  });
};

export {
  addThreadInAllCaches,
  removeThreadFromAllCaches,
  updateThreadInAllCaches,
  updateThreadTopicInAllCaches,
};
