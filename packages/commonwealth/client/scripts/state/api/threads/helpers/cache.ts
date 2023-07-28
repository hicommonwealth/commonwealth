// import { useQueryClient } from '@tanstack/react-query';
import Thread from 'models/Thread';
import Topic from 'models/Topic';
import { ApiEndpoints, queryClient } from 'state/api/config';

type IExistingThreadState = null | undefined | { pages: any[], pageParams: any[] }[] | any
type IArrayManipulationMode = 'combineAndRemoveDups' | 'removeFromExisting' | 'replaceArray'

interface CacheUpdater {
    chainId: string;
    threadId: number;
    updateBody?: Partial<Thread>;
    method: 'update' | 'remove';
    arrayManipulationMode?: IArrayManipulationMode // nested arrays are not updated
}

const cacheUpdater = ({
    chainId,
    threadId,
    updateBody,
    method,
    arrayManipulationMode = 'replaceArray'
}: CacheUpdater) => {
    const queryCache = queryClient.getQueryCache()
    const queryKeys = queryCache.getAll().map(cache => cache.queryKey)
    const keysForThreads = queryKeys.filter(x => x[0] === ApiEndpoints.FETCH_THREADS && x[1] === chainId)

    const arrayFieldsFromUpdateBody = updateBody
        ? Object.keys(updateBody).filter(k => Array.isArray(updateBody[k]))
        : []

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
                            if (
                                arrayManipulationMode === 'combineAndRemoveDups' ||
                                arrayManipulationMode === 'removeFromExisting' ||
                                arrayFieldsFromUpdateBody.length > 0
                            ) {
                                pages[foundPageIndex].data.threads[foundThreadIndex] = {
                                    ...updateBody, // destructure order is important here
                                    ...pages[foundPageIndex].data.threads[foundThreadIndex],
                                }
                                arrayFieldsFromUpdateBody.map((field) => {
                                    if (pages[foundPageIndex].data.threads[foundThreadIndex][field]) {
                                        const updateBodyFieldIds = updateBody[field].map(x => x?.id)
                                        pages[foundPageIndex].data.threads[foundThreadIndex][field] = [
                                            ...pages[foundPageIndex].data.threads[foundThreadIndex][field],
                                            // in filter we are assuming that each array field has a property 'id'
                                        ].filter(x => !updateBodyFieldIds.includes(x?.id)) // this filter takes care of 'combineAndRemoveDups'

                                        if (arrayManipulationMode === 'combineAndRemoveDups') {
                                            pages[foundPageIndex].data.threads[foundThreadIndex][field] = [...pages[foundPageIndex].data.threads[foundThreadIndex][field], ...updateBody[field]]
                                        }
                                    }
                                })
                            } else if (arrayManipulationMode === 'replaceArray') {
                                pages[foundPageIndex].data.threads[foundThreadIndex] = {
                                    ...pages[foundPageIndex].data.threads[foundThreadIndex],
                                    ...updateBody, // destructure order is important here
                                }
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
                            if (
                                arrayManipulationMode === 'combineAndRemoveDups' ||
                                arrayManipulationMode === 'removeFromExisting' ||
                                arrayFieldsFromUpdateBody.length > 0
                            ) {
                                updatedThreads[foundThreadIndex] = {
                                    ...updateBody, // destructure order is important here
                                    ...updatedThreads[foundThreadIndex],
                                }
                                arrayFieldsFromUpdateBody.map((field) => {
                                    if (updatedThreads[foundThreadIndex][field]) {
                                        const updateBodyFieldIds = updateBody[field].map(x => x?.id)
                                        updatedThreads[foundThreadIndex][field] = [
                                            ...updatedThreads[foundThreadIndex][field],
                                            // in filter we are assuming that each array field has a property 'id'
                                        ].filter(x => !updateBodyFieldIds.includes(x?.id)) // this filter takes care of 'combineAndRemoveDups'

                                        if (arrayManipulationMode === 'combineAndRemoveDups') {
                                            updatedThreads[foundThreadIndex][field] = [...updatedThreads[foundThreadIndex][field], ...updateBody[field]]
                                        }
                                    }
                                })
                            } else if (arrayManipulationMode === 'replaceArray') {
                                updatedThreads[foundThreadIndex] = {
                                    ...updatedThreads[foundThreadIndex],
                                    ...updateBody, // destructure order is important here
                                }
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

const updateThreadInAllCaches = (
    chainId: string,
    threadId: number,
    updateBody: Partial<Thread>,
    arrayManipulationMode?: IArrayManipulationMode
) => {
    cacheUpdater({ chainId, threadId, method: 'update', updateBody, arrayManipulationMode: arrayManipulationMode || 'replaceArray' })
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

const addThreadInAllCaches = (chainId: string, newThread: Thread) => {
    // refetch all caches for the thread topic and also the general cache
    const queryCache = queryClient.getQueryCache()
    const queryKeys = queryCache.getAll().map(cache => cache.queryKey)
    const keysForThreads = queryKeys.filter(x => x[0] === ApiEndpoints.FETCH_THREADS && x[1] === chainId)

    keysForThreads.map((k) => {
        if (k[2] === 'bulk' && (k[3] === newThread.topic.id || k[3] === undefined)) {
            queryClient.cancelQueries(k)
            queryClient.refetchQueries(k)
        }
        // TODO: for now single cache will fetch the thread - not adding its state, ideally we should
        // add the thread here
    })
}

export { addThreadInAllCaches, removeThreadFromAllCaches, updateThreadInAllCaches, updateThreadTopicInAllCaches };

