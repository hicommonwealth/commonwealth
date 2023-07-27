import Thread from 'models/Thread';
import { queryClient } from 'state/api/config';

const updateThreadInAllCaches = (chainId: string, thread: Thread) => {
    const queryCache = queryClient.getQueryCache()
    const queryKeys = queryCache.getAll().map(cache => cache.queryKey)
    const keysForThreads = queryKeys.filter(x => x[0] === '/threads' && x[1] === chainId)
    keysForThreads.map((k: any[]) => {
        const existingData: null | undefined | { pages: any[], pageParams: any[] }[] | any = queryClient.getQueryData(k)
        if (existingData) {
            queryClient.setQueryData(k, () => {
                const pages = [...(existingData.pages || [])]
                let foundThreadIndex = -1
                const foundPageIndex = pages.findIndex(p => {
                    const index = p.data.threads.findIndex(t => t.id === thread.id)
                    if (index > -1) foundThreadIndex = index
                    return index > -1 ? true : -1
                })
                if (foundPageIndex > -1 && foundThreadIndex > -1) {
                    pages[foundPageIndex].data.threads[foundThreadIndex] = thread
                }

                return {
                    ...existingData,
                    pages
                }
            })
        }
    })
}

export { updateThreadInAllCaches };
