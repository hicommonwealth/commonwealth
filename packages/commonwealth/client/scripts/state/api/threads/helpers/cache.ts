// import { useQueryClient } from '@tanstack/react-query';
import Thread from 'models/Thread';
import { ApiEndpoints, queryClient } from 'state/api/config';

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
        const existingData: null | undefined | { pages: any[], pageParams: any[] }[] | any = queryClient.getQueryData(k)
        if (existingData) {
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
            })
        }
    })
}

const updateThreadInAllCaches = (chainId: string, threadId: number, updateBody: Partial<Thread>) => {
    cacheUpdater({ chainId, threadId, method: 'update', updateBody })
}

const removeThreadFromAllCaches = (chainId: string, threadId: number) => {
    cacheUpdater({ chainId, threadId, method: 'remove' })
}

export { removeThreadFromAllCaches, updateThreadInAllCaches };

