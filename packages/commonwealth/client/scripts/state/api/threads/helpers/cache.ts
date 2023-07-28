// import { useQueryClient } from '@tanstack/react-query';
import Thread from 'models/Thread';
import Topic from 'models/Topic';
import { ApiEndpoints, queryClient } from 'state/api/config';

type IExistingThreadState = null | undefined | { pages: any[], pageParams: any[] }[] | any

interface CacheUpdater {
    chainId: string;
    threadId: number;
    updateBody?: Partial<Thread>;
    method: 'update' | 'remove';
}

const cacheUpdater = ({
    chainId,
    threadId,
    updateBody,
    method,
}: CacheUpdater) => {
    const queryCache = queryClient.getQueryCache()
    const queryKeys = queryCache.getAll().map(cache => cache.queryKey)
    const keysForThreads = queryKeys.filter(x => x[0] === ApiEndpoints.FETCH_THREADS && x[1] === chainId)
    keysForThreads.map((k: any[]) => {
        const existingData: IExistingThreadState = queryClient.getQueryData(k)
        if (existingData) {
            const remainingCallbacks = []
            queryClient.setQueryData(k, () => {
                if (k[2] === 'bulk') {
                    if (method === 'update') {
                        const pages = [...(existingData.pages || [])]
                        let foundThreadIndex = -1
                        const foundPageIndex = pages.findIndex(p => {
                            const index = p.data.threads.findIndex(t => t.id === threadId)
                            if (index > -1) foundThreadIndex = index
                            return index > -1 ? true : -1
                        })
                        if (foundPageIndex > -1 && foundThreadIndex > -1) {
                            pages[foundPageIndex].data.threads[foundThreadIndex] = {
                                ...pages[foundPageIndex].data.threads[foundThreadIndex],
                                ...updateBody
                            }
                        }

                        return {
                            ...existingData,
                            pages
                        }
                    }

                    if (method === 'remove') {
                        const pages = [...(existingData.pages || [])]
                        let foundThreadIndex = -1
                        const foundPageIndex = pages.findIndex(p => {
                            const index = p.data.threads.findIndex(t => t.id === threadId)
                            if (index > -1) foundThreadIndex = index
                            return index > -1 ? true : -1
                        })

                        if (foundPageIndex > -1 && foundThreadIndex > -1) {
                            pages[foundPageIndex].data.threads = pages[foundPageIndex].data.threads.filter(x => x.id !== threadId)
                        }

                        return {
                            ...existingData,
                            pages
                        }
                    }
                }

                if (k[2] === 'single') {
                    if (method === 'update') {
                        const updatedThreads = [...existingData] // threads array
                        const foundThreadIndex = updatedThreads.findIndex(x => x.id === threadId)
                        if (foundThreadIndex > -1) {
                            updatedThreads[foundThreadIndex] = {
                                ...updatedThreads[foundThreadIndex],
                                ...updateBody
                            }
                        }
                        return updatedThreads;
                    }
                    if (method === 'remove') {
                        remainingCallbacks.push(() => queryClient.refetchQueries(k))
                        return [{}]
                    }
                }
            })
            remainingCallbacks.map(x => x())
        }
    })
}

const updateThreadInAllCaches = (chainId: string, threadId: number, updateBody: Partial<Thread>) => {
    cacheUpdater({ chainId, threadId, method: 'update', updateBody })
}

const removeThreadFromAllCaches = (chainId: string, threadId: number) => {
    cacheUpdater({ chainId, threadId, method: 'remove' })
}

const updateThreadTopicInAllCaches = (chainId: string, threadId: number, newTopic: Topic, oldTopicId: number) => {
    const queryCache = queryClient.getQueryCache()
    const queryKeys = queryCache.getAll().map(cache => cache.queryKey)
    const keysForThreads = queryKeys.filter(x => x[0] === ApiEndpoints.FETCH_THREADS && x[1] === chainId)

    keysForThreads.map((k) => {
        // 1- for single queries - just update the topic
        if (k[2] === 'single' && (k[3] === threadId || (k[3] as number[])?.includes(threadId))) {
            const existingData: IExistingThreadState = queryClient.getQueryData(k)
            const updatedThreads = [...existingData] // threads array
            const foundThreadIndex = updatedThreads.findIndex(x => x.id === threadId)
            if (foundThreadIndex > -1) {
                updatedThreads[foundThreadIndex] = {
                    ...updatedThreads[foundThreadIndex],
                    topic: newTopic,
                }
            }
            queryClient.setQueryData(k, () => updatedThreads);
        }

        // 2- for bulk queries
        if (k[2] === 'bulk') {
            // filter from old topic query
            if (k[3] === oldTopicId || k[3] === undefined) {
                const existingData: IExistingThreadState = queryClient.getQueryData(k)
                const pages = [...(existingData.pages || [])]
                let foundThreadIndex = -1
                const foundPageIndex = pages.findIndex(p => {
                    const index = p.data.threads.findIndex(t => t.id === threadId)
                    if (index > -1) foundThreadIndex = index
                    return index > -1 ? true : -1
                })

                if (foundPageIndex > -1 && foundThreadIndex > -1) {
                    pages[foundPageIndex].data.threads = pages[foundPageIndex].data.threads.filter(x => x.id !== threadId)
                }

                return {
                    ...existingData,
                    pages
                }
            }
            // and refetch new topic queries
            if (k[3] === newTopic.id || k[3] === undefined) {
                queryClient.cancelQueries(k)
                queryClient.refetchQueries(k)
            }
        }

    })

}

export { removeThreadFromAllCaches, updateThreadInAllCaches, updateThreadTopicInAllCaches };

